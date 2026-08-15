import { createApp } from './dist/app.js';
import { loadConfig } from './dist/config.js';
import { createAuth } from './dist/modules/auth/auth.js';
import { createClient } from '@libsql/client';
import express from 'express';

async function main() {
  const config = loadConfig();
  const client = createClient({ url: 'file::memory:' });
  const auth = createAuth(client, config);
  
  try {
    const headers = new Headers();
    headers.set("origin", "tauri://localhost");
    headers.set("host", "localhost:3000");
    headers.set("authorization", "Bearer fake-token");
    
    // What if we delete origin?
    const cloned = new Headers(headers);
    cloned.delete("origin");
    
    await auth.api.getSession({ headers: cloned });
    console.log("getSession with deleted origin succeeded!");
  } catch(e) {
    console.error("Error from getSession:", e);
  }
}
main();
