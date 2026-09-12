/**
 * CodeGuard AI - Curated Sample Snippets for Instant Testing
 * Contains realistic vulnerable and buggy code for all 6 supported languages.
 */

const SAMPLE_CODES = {
  javascript: {
    title: 'Express.js SQLi & XSS Vulnerability',
    language: 'javascript',
    code: `const express = require('express');
const app = express();
const db = require('./database');
const crypto = require('crypto');

const API_KEY = "AIzaSyD-TESTING-SECRET-KEY-99482";

app.get('/user', async (req, res) => {
  const userId = req.query.id;

  // CRITICAL: SQL Injection via string concatenation
  const query = "SELECT * FROM users WHERE id = " + userId;
  const result = await db.query(query);

  // Insecure Password Hash using MD5
  const sessionToken = crypto.createHash('md5').update(userId).digest('hex');

  // Accidental assignment in conditional
  if (result.length = 0) {
    return res.status(404).send('User not found');
  }

  // Debugger left in production code
  debugger;

  res.send({ user: result[0], token: sessionToken });
});

app.post('/profile', (req, res) => {
  const userBio = req.body.bio;
  // High: DOM Cross-site scripting
  document.getElementById('bio-display').innerHTML = userBio;
  res.send('Profile updated');
});

app.listen(3000, () => console.log('Server running'));`
  },

  typescript: {
    title: 'TypeScript Type-Safety & Security Flaws',
    language: 'typescript',
    code: `import express, { Request, Response } from 'express';
import { Pool } from 'pg';

const pool = new Pool();
const SECRET_TOKEN = "ghp_ABC1234567890abcdefghijklmnopqr";

// Explicit any disables TypeScript safety
async function getUserData(id: any): Promise<any> {
  // SQL Injection via template literal
  const query = \`SELECT * FROM accounts WHERE id = \${id}\`;
  const res = await pool.query(query);
  return res.rows[0];
}

// Non-null assertion on potentially null object
function getUsername(user: { name?: string } | null): string {
  // @ts-ignore
  return user!.name;
}

export { getUserData, getUsername };`
  },

  python: {
    title: 'Python Insecure Deserialization & SQLi',
    language: 'python',
    code: `import os
import pickle
import hashlib
import sqlite3

AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLEKEY12345"

def get_user_profile(user_id):
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    
    # Critical: SQL injection via string formatting
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)
    return cursor.fetchone()

def load_user_session(raw_cookie_data):
    # Critical: Insecure deserialization via pickle
    user_session = pickle.loads(raw_cookie_data)
    return user_session

def execute_maintenance(cmd):
    # Critical: Command injection via os.system
    os.system(f"echo Running maintenance: {cmd}")

def hash_pin(pin):
    # High: Weak hash algorithm
    return hashlib.md5(pin.encode()).hexdigest()

def process_items(items=[]):
    # Medium: Mutable default argument
    items.append(1)
    return items`
  },

  java: {
    title: 'Java JDBC SQLi & Runtime.exec Flaws',
    language: 'java',
    code: `package com.codeguard.demo;

import java.sql.Connection;
import java.sql.Statement;
import java.sql.ResultSet;
import java.io.ObjectInputStream;
import java.security.MessageDigest;

public class UserService {
    private static final String DB_PASSWORD = "SuperSecretDbPassword123!";

    public void searchUser(Connection conn, String userInput) {
        try {
            Statement stmt = conn.createStatement();
            // Critical: SQL Injection via string concatenation
            String sql = "SELECT * FROM users WHERE username = '" + userInput + "'";
            ResultSet rs = stmt.executeQuery(sql);
            
            while (rs.next()) {
                System.out.println(rs.getString("email"));
            }
        } catch (Exception e) {
            // Swallowed exception
        }
    }

    public void runBackup(String backupPath) throws Exception {
        // Critical: Command injection
        Runtime.getRuntime().exec("tar -czf backup.tar.gz " + backupPath);
    }

    public byte[] hashPassword(String password) throws Exception {
        // Weak hash algorithm
        MessageDigest md = MessageDigest.getInstance("MD5");
        return md.digest(password.getBytes());
    }
}`
  },

  cpp: {
    title: 'C++ Buffer Overflow & Memory Leak',
    language: 'cpp',
    code: `#include <iostream>
#include <cstring>
#include <cstdio>

void processInput() {
    char buffer[64];
    
    // Critical: Banned function gets()
    std::cout << "Enter username: ";
    gets(buffer);

    char greeting[128];
    // High: Unbounded strcpy
    strcpy(greeting, "Hello, ");
    strcat(greeting, buffer);

    // Critical: Format string vulnerability
    printf(greeting);
    std::cout << std::endl;
}

void allocateResources() {
    // Quality: Raw new without delete (Memory Leak)
    int* data = new int[1000];
    data[0] = 42;
    std::cout << "Processed resource: " << data[0] << std::endl;
}

int main() {
    processInput();
    allocateResources();
    return 0;
}`
  },

  go: {
    title: 'Go SQLi & Unhandled Error Flaws',
    language: 'go',
    code: `package main

import (
	"database/sql"
	"fmt"
	"os/exec"
)

const ApiSecret = "sec_live_99482019482039482019"

func QueryAccount(db *sql.DB, accountId string) {
	// Critical: SQL Injection via fmt.Sprintf
	query := fmt.Sprintf("SELECT * FROM accounts WHERE id = '%s'", accountId)
	
	// Medium: Discarded error return value
	rows, _ := db.Query(query)
	defer rows.Close()
}

func ExecuteShell(userInput string) {
	// Critical: Command Injection in shell invocation
	cmd := exec.Command("sh", "-c", "echo "+userInput)
	cmd.Run()
}

func main() {
	fmt.Println("CodeGuard Go Demo")
}`
  }
};

module.exports = {
  SAMPLE_CODES
};
