import { app, BrowserWindow, ipcMain } from 'electron';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { applyEconomyOverlayWindow, normalizeEconomyOverlaySettings, type EconomyOverlaySettings } from './economy-overlay-window.js';

let latestSettings:EconomyOverlaySettings|null=null;

function settingsPath(){return join(app.getPath('userData'),'overlay-settings.json')}
function findOverlayWindow(){return BrowserWindow.getAllWindows().find(window=>window.webContents.getURL().includes('/overlay'))??null}
function apply(raw:unknown){latestSettings=normalizeEconomyOverlaySettings(raw);return applyEconomyOverlayWindow(findOverlayWindow(),latestSettings)}
async function loadSettings(){try{return apply(JSON.parse(await readFile(settingsPath(),'utf8')))}catch{return apply({})}}
function shouldShow(settings:EconomyOverlaySettings){return settings.economyEnabled||(settings.lastSeenEnabled===true&&settings.lastSeenOverlayEnabled!==false)}

const originalHandle=ipcMain.handle.bind(ipcMain);
(ipcMain as typeof ipcMain&{handle:typeof ipcMain.handle}).handle=((channel:string,listener:any)=>{
  if(channel==='dota-flow:set-overlay-settings'){
    return originalHandle(channel,async(...args:any[])=>{const result=await listener(...args);apply(result);return result});
  }
  if(channel==='dota-flow:show-overlay'){
    return originalHandle(channel,async(...args:any[])=>{const result=await listener(...args);const current=latestSettings??await loadSettings();if(shouldShow(current))apply(current);return result});
  }
  if(channel==='dota-flow:hide-overlay'){
    return originalHandle(channel,async(...args:any[])=>{const result=await listener(...args);findOverlayWindow()?.hide();return result});
  }
  return originalHandle(channel,listener);
}) as typeof ipcMain.handle;

app.on('browser-window-created',(_event,window)=>{
  window.webContents.on('did-finish-load',()=>{
    if(window.webContents.getURL().includes('/overlay'))void loadSettings();
  });
});

await import('./main.js');
