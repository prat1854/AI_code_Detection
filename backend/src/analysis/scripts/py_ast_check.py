import sys
import ast
import json

def check_python_code(code_str):
    issues = []
    is_valid = True
    
    # 1. Deterministic Syntax and Indentation Validation
    try:
        tree = ast.parse(code_str)
    except SyntaxError as e:
        is_valid = False
        issues.append({
            "id": f"py-syntax-err-{e.lineno or 1}-{e.offset or 1}",
            "severity": "critical",
            "category": "syntax",
            "ruleId": "python-syntax-error",
            "title": f"Python {type(e).__name__}",
            "line": e.lineno or 1,
            "column": e.offset or 1,
            "endLine": e.lineno or 1,
            "endColumn": (e.offset or 1) + 5,
            "message": str(e.msg),
            "explanation": f"The Python compiler encountered a {type(e).__name__} at line {e.lineno or 1}: {e.msg}",
            "risk": "Compilation and execution fails. Script cannot be imported or executed.",
            "suggestion": "Fix the syntax or indentation at the specified line.",
            "source": "python-compiler"
        })
        return {"isValid": False, "issues": issues}

    # 2. AST Visitor for Security and Bugs
    for node in ast.walk(tree):
        lineno = getattr(node, 'lineno', 1)
        col = getattr(node, 'col_offset', 0) + 1

        # Check eval() and exec()
        if isinstance(node, ast.Call):
            func_name = ""
            if isinstance(node.func, ast.Name):
                func_name = node.func.id
            elif isinstance(node.func, ast.Attribute):
                func_name = node.func.attr

            if func_name in ("eval", "exec"):
                issues.append({
                    "id": f"py-sec-eval-{lineno}",
                    "severity": "critical",
                    "category": "security",
                    "ruleId": f"python-no-{func_name}",
                    "title": f"Dangerous Dynamic Code Execution ({func_name})",
                    "line": lineno,
                    "column": col,
                    "endLine": lineno,
                    "endColumn": col + len(func_name),
                    "message": f"Direct invocation of Python's built-in {func_name}() detected.",
                    "explanation": f"{func_name}() parses and executes arbitrary Python code within the current interpreter context.",
                    "risk": "Arbitrary code execution (RCE) if any external input reaches this call.",
                    "suggestion": "Use ast.literal_eval() for safe data literal parsing, or avoid dynamic evaluation.",
                    "source": "python-ast"
                })

            # Check os.system(...) and subprocess.Popen(..., shell=True)
            if func_name == "system" and isinstance(getattr(node, 'func', None), ast.Attribute):
                if getattr(node.func.value, 'id', None) == "os":
                    issues.append({
                        "id": f"py-sec-ossystem-{lineno}",
                        "severity": "critical",
                        "category": "security",
                        "ruleId": "python-os-system",
                        "title": "Insecure Command Execution (os.system)",
                        "line": lineno,
                        "column": col,
                        "endLine": lineno,
                        "endColumn": col + 12,
                        "message": "Use of os.system() detected. Subshell command execution vulnerability.",
                        "explanation": "os.system runs commands through the system shell. Any unescaped input leads directly to command injection.",
                        "risk": "Command injection leading to host server takeover.",
                        "suggestion": "Use subprocess.run(['cmd', 'arg1'], shell=False) with parameterized arguments.",
                        "source": "python-ast"
                    })

            # Check pickle.loads() / pickle.load()
            if func_name in ("loads", "load") and getattr(getattr(node, 'func', None), 'value', None):
                if getattr(node.func.value, 'id', None) == "pickle":
                    issues.append({
                        "id": f"py-sec-pickle-{lineno}",
                        "severity": "critical",
                        "category": "security",
                        "ruleId": "python-insecure-deserialization",
                        "title": "Insecure Deserialization via pickle",
                        "line": lineno,
                        "column": col,
                        "endLine": lineno,
                        "endColumn": col + 12,
                        "message": "Deserialization of untrusted data using pickle.",
                        "explanation": "Python's pickle module is fundamentally unsafe for untrusted inputs. It allows arbitrary object instantiation and code execution during unpickling.",
                        "risk": "Remote Code Execution (RCE) via crafted pickle payloads.",
                        "suggestion": "Use safe serialization formats like JSON, MessagePack, or Protocol Buffers.",
                        "source": "python-ast"
                    })

            # Check yaml.load without Loader=SafeLoader
            if func_name == "load" and getattr(getattr(node, 'func', None), 'value', None):
                if getattr(node.func.value, 'id', None) == "yaml":
                    has_safe_loader = any(
                        kw.arg == "Loader" and "Safe" in getattr(kw.value, 'id', '')
                        for kw in node.keywords
                    )
                    if not has_safe_loader:
                        issues.append({
                            "id": f"py-sec-yaml-{lineno}",
                            "severity": "high",
                            "category": "security",
                            "ruleId": "python-insecure-yaml",
                            "title": "Unsafe YAML Deserialization",
                            "line": lineno,
                            "column": col,
                            "endLine": lineno,
                            "endColumn": col + 10,
                            "message": "yaml.load() without SafeLoader enables arbitrary Python object instantiation.",
                            "explanation": "PyYAML default load can construct arbitrary Python objects leading to arbitrary execution.",
                            "risk": "Remote Code Execution through malicious YAML.",
                            "suggestion": "Use yaml.safe_load() instead of yaml.load().",
                            "source": "python-ast"
                        })

        # Check for bare except:
        if isinstance(node, ast.ExceptHandler) and node.type is None:
            issues.append({
                "id": f"py-bug-bare-except-{lineno}",
                "severity": "medium",
                "category": "bugs",
                "ruleId": "python-bare-except",
                "title": "Bare 'except:' Clause",
                "line": lineno,
                "column": col,
                "endLine": lineno,
                "endColumn": col + 7,
                "message": "Catching all exceptions with bare 'except:' catches KeyboardInterrupt and SystemExit.",
                "explanation": "A bare except catches BaseException, which intercepts system exits, process termination signals, and obscures unexpected bugs.",
                "risk": "Masked exceptions, inability to gracefully stop the program, and difficult debugging.",
                "suggestion": "Catch specific exceptions like 'except Exception:' or 'except ValueError:'.",
                "source": "python-ast"
            })

        # Check for mutable default arguments (def foo(bar=[]))
        if isinstance(node, ast.FunctionDef):
            for default in node.args.defaults:
                if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                    def_line = getattr(default, 'lineno', lineno)
                    issues.append({
                        "id": f"py-bug-mutable-default-{def_line}",
                        "severity": "medium",
                        "category": "bugs",
                        "ruleId": "python-mutable-default-arg",
                        "title": "Mutable Default Argument in Function Definition",
                        "line": def_line,
                        "column": getattr(default, 'col_offset', 0) + 1,
                        "endLine": def_line,
                        "endColumn": getattr(default, 'col_offset', 0) + 5,
                        "message": "Default parameter value is a mutable container (list/dict/set).",
                        "explanation": "In Python, default arguments are evaluated once when the function is defined, so mutations are shared across all calls.",
                        "risk": "Accidental state leakage between consecutive function invocations.",
                        "suggestion": "Use None as the default value and initialize inside the function (e.g., if arg is None: arg = []).",
                        "source": "python-ast"
                    })

    return {"isValid": is_valid, "issues": issues}

if __name__ == "__main__":
    raw_input = sys.stdin.read()
    result = check_python_code(raw_input)
    print(json.dumps(result))
