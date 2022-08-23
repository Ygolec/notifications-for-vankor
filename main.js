const {app, BrowserWindow, nativeImag, Tray, Menu,ipcMain} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs');
const Alert = require("electron-alert");
let alert = new Alert();
let mainWindow;



function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            plugins: true,
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload.js'),
            show:false
        }
    })

    ipcMain.on('asynchronous-message', (event, swalOptions) => {
        console.log(swalOptions)
        let promise = alert.fireWithFrame(swalOptions, "Информация", null, false);
    })
    ipcMain.on('auto-start', (event, options) => {
        const exeName = path.basename(process.execPath);
        if (options){
        app.setLoginItemSettings({
            openAtLogin: true,
            openAsHidden:true,
            path: process.execPath,
            args: [
                '--processStart', `"${exeName}"`,
                '--process-start-args', `"--hidden"`
            ]
        })
        }else {
            app.setLoginItemSettings({
                openAtLogin: false,
                openAsHidden:true,
                path: process.execPath,
                args: [
                    '--processStart', `"${exeName}"`,
                    '--process-start-args', `"--hidden"`
                ]
            })
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

function applicationMenu() {
    let currentZoom = mainWindow.webContents.getZoomFactor();
    const template = [
        {
            label: 'Файл',
            submenu: [{
                label: 'Закрыть!',
                click: function () {
                    app.quit()
                }
            }
            ]
        },
        {
            label: 'Редактировать',
            submenu: [{
                label: 'Шаг назад', accelerator: 'CmdOrCtrl+Z',
                click: function () {
                    mainWindow.webContents.undo();
                }
            },
                {
                    label: 'Шаг вперед', accelerator: 'CmdOrCtrl+Y',
                    click: function () {
                        mainWindow.webContents.redo();
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Вырезать', accelerator: 'CmdOrCtrl+X',
                    click: function () {
                        mainWindow.webContents.cut();
                    }
                },
                {
                    label: 'Скопировать', accelerator: 'CmdOrCtrl+C',
                    click: function () {
                        mainWindow.webContents.copy();
                    }
                }, {
                    label: 'Вставить', accelerator: 'CmdOrCtrl+V',
                    click: function () {
                        mainWindow.webContents.paste();
                    }
                },
                {
                    label: 'Удалить',
                    click: function () {
                        mainWindow.webContents.delete();
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Выделить все', accelerator: 'CmdOrCtrl+A',
                    click: function () {
                        mainWindow.webContents.selectAll();
                    }
                }
            ]
        },
        {
            label: 'Вид', submenu: [{
                label: 'Перезагрузить интерфейс', accelerator: 'CmdOrCtrl+R',
                click: function () {
                    mainWindow.webContents.reload();
                }
            }, {
                label: 'Активировать инструменты разработчика', accelerator: 'CmdOrCtrl+Shift+I',
                click: function () {
                    mainWindow.webContents.openDevTools();
                }
            }, {
                type: 'separator'
            }, {
                label: 'Исходный размер', accelerator: 'CmdOrCtrl+0',
                click: function () {
                    mainWindow.webContents.setZoomFactor(currentZoom)
                }
            }, {
                label: 'Увеличить интерфейс', accelerator: 'CmdOrCtrl+Plus',
                click: function () {
                    mainWindow.webContents.zoomFactor = currentZoom + 0.2;
                }
            }, {
                label: 'Уменьшить интерфейс', accelerator: 'CmdOrCtrl+-',
                click: function () {
                    mainWindow.webContents.zoomFactor = currentZoom - 0.2;
                }
            }, {
                type: 'separator'
            }, {
                label: 'На полный экран', accelerator: 'F11',
                click: function () {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen());
                }
            }
            ]
        }, {
            label: 'Помощь', submenu: [{
                label: 'О приложении', click() {
                    let swalOptions = {
                        title: "Инфо",
                        html: "Данное приложение разработано для отправки сообщений о грядущем событии сотрудникам через внутреннюю систему Outlook<br>" +
                            "Разработчик: Чистобаев Даниил<br>" +
                            "<a href='mailto:thekevindit@gmail.com\'>Задавайте вопросы по электронной почте</a>",
                        icon: "info",
                        showCancelButton: true
                    };
                    let promise = alert.fireWithFrame(swalOptions, "Информация", null, false);

                }
            },
                {
                    label: 'Инструкция', click() {
                        let infowindow=createWindow()
                        infowindow.loadURL(__dirname + "/help.pdf")
                    }
                }]
        }
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {

    mainWindow = createWindow();
    applicationMenu();
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


