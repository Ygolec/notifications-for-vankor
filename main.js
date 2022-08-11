const {app, BrowserWindow, nativeImage, Tray, Menu} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs');


let mainWindow;

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    let tray = null;
    win.on('minimize', function (event) {
        event.preventDefault();
        win.setSkipTaskbar(true);
        tray = createTray();
    });

    win.on('restore', function (event) {
        win.show();
        win.setSkipTaskbar(false);
        tray.destroy();
    });

    let setting = {
        path: path.resolve('.', 'notifications-for-vankor.exe')
    };
    let data = JSON.stringify(setting, null, 2)
    fs.writeFileSync('path.json', data)


    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
    return win;
}

function createTray() {
    let appIcon = new Tray(path.join(__dirname, "icon.png"));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Открыть', click: function () {
                mainWindow.show();
            }
        },
        {
            label: 'Выйти', click: function () {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);

    appIcon.on('double-click', function (event) {
        mainWindow.show();
    });
    appIcon.setToolTip('Уведомления для обучения');
    appIcon.setContextMenu(contextMenu);
    return appIcon;
}


app.whenReady().then(() => {
    mainWindow = createWindow();
    mainWindow.once('ready-to-show', () => {

        mainWindow.show();

    })
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});



// app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//         createWindow();
//     }
// });


