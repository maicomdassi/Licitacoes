const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const electronServe = require('electron-serve');
const isDev = require('electron-is-dev');

// Desabilitar menu no modo produção
if (!isDev) {
  Menu.setApplicationMenu(null);
}

// Carregador para o modo produção
const loadURL = electronServe({ directory: path.join(__dirname, '../out') });

// Função para criar a janela principal
function createWindow() {
  // Criar a janela do navegador
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: 'Sistema de Gestão de Licitações',
  });

  // Carregar o conteúdo
  if (isDev) {
    // Em desenvolvimento, carrega do servidor local
    mainWindow.loadURL('http://localhost:3000');
    // Abre o DevTools automaticamente
    mainWindow.webContents.openDevTools();
  } else {
    // Em produção, carrega do diretório estático
    loadURL(mainWindow);
  }
}

// Quando o Electron terminar de inicializar
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // No macOS, é comum recriar uma janela no app quando o
    // ícone do dock é clicado e não há outras janelas abertas.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Sair quando todas as janelas estiverem fechadas
app.on('window-all-closed', function () {
  // No macOS é comum para aplicativos e sua barra de menu
  // permanecerem ativos até que o usuário saia explicitamente
  if (process.platform !== 'darwin') app.quit();
}); 