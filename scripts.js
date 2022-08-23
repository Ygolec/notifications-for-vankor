

function exel() {
    const fs = require('fs');
    const readXlsxFile = require('read-excel-file/node')
    const dataSet = fs.readFileSync('settings.json', 'utf8');
    let settings = JSON.parse(dataSet)
    if (fs.existsSync(settings['pathToExel'])) {
        readXlsxFile(settings['pathToExel']).then((rows, errors) => {
            let data = JSON.stringify(rows, null, 2)
            fs.writeFileSync('exel.json', data)
        })
        return true;
    } else {
        const {ipcRenderer} = require('electron')
        let swalOptions = {
            title: "Файл Excel не найден",
            text:  "Пройдите в настройки и укажите новый путь к Excel с данными пользователей",
            icon: "warning"
        };
        ipcRenderer.send('asynchronous-message', swalOptions)
        stopCheck()
        return false;
    }

}

function readSettings() {
    const fs = require('fs');
    fs.readFile('settings.json', 'utf8', (err, data) => {
        if (err) throw err;
        let settings = JSON.parse(data)
        const days = fs.readFileSync('daysToSend.json', 'utf8');
        let daysSelect = JSON.parse(days)
        document.getElementById('Subject').value = settings['subject']
        document.getElementById('Body').value = settings['body']
        document.getElementById('timeToSend').value = settings['dayToSend']
        document.getElementById('pathToExel').value = settings['pathToExel']
        document.getElementById('fromEmail').value = settings['fromEmail']
        document.getElementById('autoStart').checked = settings['autoStart']
        if (daysSelect['idDay'] === 'other') {
            document.getElementById(daysSelect['idDay']).checked = true
            document.getElementById(daysSelect['idDay'] + 'Text').disabled = false;
            document.getElementById(daysSelect['idDay'] + 'Text').value = daysSelect['dayToSend']
        } else {
            document.getElementById(daysSelect['idDay']).checked = true
        }
    });
}

function sendEmail() {

    const fs = require('fs');

    const dataSet = fs.readFileSync('settings.json', 'utf8');
    const dataExel = fs.readFileSync('exel.json', 'utf8');

    let settings = JSON.parse(dataSet)
    let subject = settings['subject'];
    let body = settings['body'];
    let frEmail = settings['fromEmail'];
    let exel = JSON.parse(dataExel)
    let today = new Date()
    let namesOfError = new Array()

    let massiveNameToSend = exel.flatMap((matrixRow, index) => {
        if (index >= 2) {
            let ok = false
            let data = new Date(matrixRow[3])
            let temp = Math.floor((data - today) / 86400000)

            if (temp < 0) {
                namesOfError.push(matrixRow[0])
            }

            if ((temp < settings['dayToSend']) && temp > 0) {
                ok = true
            }

            if (ok) {
                return [matrixRow[1]]
            }
        }
        return []
    })
    let to = massiveNameToSend.join(';');
    if (namesOfError.length!==0) {
        const {ipcRenderer} = require('electron')

        let swalOptions = {
            title: "Обновите информацию об этих пользователях в Excel:",
            text:  namesOfError,
            icon: "warning",
            singletonId: "do-you-want-to-exit-alert"
        };
        ipcRenderer.send('asynchronous-message', swalOptions)
    }
    if (massiveNameToSend !== "") {
        to += ";"
        let options = {
            args: [subject, body, to, frEmail]
        };

        let python = require("child_process").execFile("main.exe", options.args);

        showNotification()
    }
}

async function saveSettings() {
    if (await checkEmailFrom()) {
        const fs = require('fs');

        let a = document.getElementById("Subject").value
        let b = document.getElementById('Body').value
        let c = document.getElementById('timeToSend').value
        let d = document.getElementById('pathToExel').value
        let e = document.getElementById('fromEmail').value
        let f = document.getElementById('otherText').value

        let dataDays = fs.readFileSync('daysToSend.json', 'utf8')
        let Days = JSON.parse(dataDays)
        if (Days['dayToSend'] === "") {
            Days['dayToSend'] = f
            let dataToWhite = JSON.stringify(Days, null, 2)
            fs.writeFileSync('daysToSend.json', dataToWhite)
        }

        if (a && b && c && d && e) {
            let setting = {
                subject: document.getElementById('Subject').value,
                body: document.getElementById('Body').value,
                dayToSend: document.getElementById('timeToSend').value,
                pathToExel: document.getElementById('pathToExel').value,
                fromEmail: document.getElementById('fromEmail').value,
                autoStart: document.getElementById('autoStart').checked,
            };

            let data = JSON.stringify(setting, null, 2)

            fs.writeFileSync('settings.json', data)
            const {ipcRenderer} = require('electron')
            let swalOptions = {
                title: 'Готово!',
                icon: "success"
            };
            ipcRenderer.send('asynchronous-message', swalOptions)
            return true;
        } else {
            const {ipcRenderer} = require('electron')
            let swalOptions = {
                text: 'Заполните все поля!',
                icon: "warning"
            };
            ipcRenderer.send('asynchronous-message', swalOptions)
            return false;
        }
    } else {
        return false;
    }
}

function autoStartup(checkThis) {
    if (checkThis.checked) {
        createStartup()
    } else {
        removeStartup()
    }

}

function createStartup() {
    const {ipcRenderer} = require('electron')
    let options=true
    ipcRenderer.send('auto-start', options)
}

function removeStartup() {

    const {ipcRenderer} = require('electron')
    let options=false
    ipcRenderer.send('auto-start', options)
}

async function checkEmailFrom() {
    let frEmail = document.getElementById('fromEmail').value;

    const runPy = async (frEmail) => {
        let python = require("child_process").execFile("foremail.exe", [frEmail]);
        const result = await new Promise((resolve) => {
            python.stdout.on("data", function (data) {
                data=data.replace(/\r?\n|\r/g, "")
                if (data === "True") {
                    return resolve(true);
                } else {
                    const {ipcRenderer} = require('electron')
                    let swalOptions = {
                        text: "Email не найден, укажите правильный Email!",
                        icon: "error",
                        showCancelButton: true
                    };
                    ipcRenderer.send('asynchronous-message', swalOptions)
                    return resolve(false);
                }
            });
        });
        return result;
    };
    let temp=await runPy(frEmail)

    if (temp) {
        return true;
    } else {
        return false;
    }
}

function showNotification() {
    const NOTIFICATION_TITLE = 'Уведомление'
    const NOTIFICATION_BODY = 'Сообщения отправлены!'

    const notify = new Notification(NOTIFICATION_TITLE, {
        body: NOTIFICATION_BODY,
    });
}

function enableText() {
    document.getElementById("otherText").disabled = false;
}

function checkExcel() {
    const fs = require('fs');
    if (exel()) {
        const dataSet = fs.readFileSync('settings.json', 'utf8');
        const dataExel = fs.readFileSync('exel.json', 'utf8');

        let settings = JSON.parse(dataSet)
        let excel = JSON.parse(dataExel)
        let today = new Date()
        let namesOfError = new Array();
        let massiveNameToSend = excel.flatMap((matrixRow, index) => {
            if (index >= 2) {
                let ok = false
                let data = new Date(matrixRow[3])
                let temp = Math.floor((data - today) / 86400000)


                if (temp < 0) {
                    namesOfError.push(matrixRow[0])
                }

                if ((temp < settings['dayToSend']) && temp > 0) {
                    ok = true
                }

                if (ok) {
                    return [matrixRow[1]]
                }
            }

            return []
        })

        if (namesOfError.length!==0) {
            const {ipcRenderer} = require('electron')

            let swalOptions = {
                title: "Обновите информацию об этих пользователях в Excel:",
                text:  namesOfError,
                icon: "warning",
                singletonId: "do-you-want-to-exit-alert"
            };
            ipcRenderer.send('asynchronous-message', swalOptions)
        }
        return massiveNameToSend;
    } else {
        return false;
    }

}

function send(massiveNameToSend) {
    const fs = require('fs');


    const dataSet = fs.readFileSync('settings.json', 'utf8');

    let settings = JSON.parse(dataSet)
    let subject = settings['subject'];
    let body = settings['body'];
    let frEmail = settings['fromEmail'];

    let to = massiveNameToSend.join(';');

    to += ";"
    let options = {
        args: [subject, body, to, frEmail]
    };

    let python = require("child_process").execFile("main.exe", options.args);
    showNotification()
}

function autoCheck() {
    lamp()
    const fs = require('fs');
    const schedule = require('node-schedule')

    const dataSet = fs.readFileSync('Check.json', 'utf8');
    let settings = JSON.parse(dataSet)
    let job = null
    if (settings['autoCheck']) {
        document.getElementById('buttonStart').disabled = true;
        document.getElementById('buttonStop').disabled = false;
        let rule = new schedule.RecurrenceRule();
        // rule.hour = new schedule.Range(0, 23, 1);

        job = schedule.scheduleJob('* 1 * * *', function () {
            let massiveNameToSend = checkExcel()
            if (massiveNameToSend !== false) {

                checkDate(massiveNameToSend)
            }

        });
    } else {
        document.getElementById('buttonStart').disabled = false;
        document.getElementById('buttonStop').disabled = true;
    }

}

function startCheck() {
    const fs = require('fs');

    let setting = {
        autoCheck: true
    };
    let data = JSON.stringify(setting, null, 2)
    fs.writeFileSync('Check.json', data)

    let lastDate = new Date()
    setting = {
        lastDate: lastDate
    };
    data = JSON.stringify(setting, null, 2)
    fs.writeFileSync('lastDate.json', data)

    autoCheck()
}

function stopCheck() {
    const schedule = require('node-schedule')
    const fs = require('fs');

    let setting = {
        autoCheck: false
    };
    let data = JSON.stringify(setting, null, 2)
    fs.writeFileSync('Check.json', data)
    schedule.gracefulShutdown();
    lamp();
    document.getElementById('buttonStart').disabled = false;
    document.getElementById('buttonStop').disabled = true;
}

function checkDate(massiveNameToSend) {
    const fs = require('fs');

    const dataSet = fs.readFileSync('lastDate.json', 'utf8');
    const dataDays = fs.readFileSync('daysToSend.json', 'utf8');

    let settings = JSON.parse(dataSet)
    let Days = JSON.parse(dataDays)
    let DayToSend = Days['dayToSend']
    let date_1 = new Date();
    let date_2 = new Date(settings['lastDate']);
    let difference = date_1.getTime() - date_2.getTime();
    let TotalDays = Math.floor(difference / (1000 * 3600 * 24));
    if (TotalDays < 0) {
        let lastDate = new Date()
        let settingDay = {
            lastDate: lastDate
        };
        let dataDay = JSON.stringify(settingDay, null, 2)
        fs.writeFileSync('lastDate.json', dataDay)
    }

    if (TotalDays >= DayToSend) {
        if (massiveNameToSend.length!==0) {
            send(massiveNameToSend);
            let lastDate = new Date()
            let settingDay = {
                lastDate: lastDate
            };
            let dataDay = JSON.stringify(settingDay, null, 2)
            fs.writeFileSync('lastDate.json', dataDay)
        }

    }
}

function test(id) {
    const fs = require('fs');

    let days = null
    if (id === 'everyDay') {
        days = 1
    }
    if (id === 'threeDay') {
        days = 3
    }
    if (id === 'everyWeek') {
        days = 7
    }
    if (id === 'other') {
        days = document.getElementById('otherText').value
    }
    let setting = {
        dayToSend: days,
        idDay: id
    };
    let data = JSON.stringify(setting, null, 2)
    fs.writeFileSync('daysToSend.json', data)
}

function lamp() {
    const fs = require('fs');

    const dataSet = fs.readFileSync('Check.json', 'utf8');
    let settings = JSON.parse(dataSet)

    if (settings['autoCheck']) {
        document.getElementById("negative_lamp").style.display = "none";
        document.getElementById("positive_lamp").style.display = "block"
    } else {
        document.getElementById("positive_lamp").style.display = "none";
        document.getElementById("negative_lamp").style.display = "block";
    }
}


