const schedule = require("node-schedule");

function exel() {
    const fs = require('fs');
    const readXlsxFile = require('read-excel-file/node')
    const dataSet = fs.readFileSync('settings.json', 'utf8');

    let settings = JSON.parse(dataSet)

    readXlsxFile(settings['pathToExel']).then((rows) => {

        let data = JSON.stringify(rows, null, 2)
        fs.writeFileSync('exel.json', data)
    })
}

function readSettings() {
    const fs = require('fs');
    fs.readFile('settings.json', 'utf8', (err, data) => {
        if (err) throw err;
        let settings = JSON.parse(data)
        document.getElementById('Subject').value = settings['subject']
        document.getElementById('Body').value = settings['body']
        document.getElementById('timeToSend').value = settings['dayToSend']
        document.getElementById('pathToExel').value = settings['pathToExel']
        document.getElementById('fromEmail').value = settings['fromEmail']
        document.getElementById('autoStart').checked = settings['autoStart']
    });
}

function sendEmail() {
    let {PythonShell} = require('python-shell');
    const fs = require('fs');
    const dataSet = fs.readFileSync('settings.json', 'utf8');
    const dataExel = fs.readFileSync('exel.json', 'utf8');

    let settings = JSON.parse(dataSet)
    let subject = settings['subject'];
    let body = settings['body'];
    let frEmail = settings['fromEmail'];
    let exel = JSON.parse(dataExel)
    let today = new Date()

    let massiveNameToSend = exel.flatMap((matrixRow, index) => {
        if (index >= 2) {
            let ok = false
            let data = new Date(matrixRow[2])
            let temp = Math.floor((data - today) / 86400000)

            if (temp < 0) {
                alert(matrixRow[0] + " Нужно обновить информацию или срочно пройти обучение!")
            }

            if ((temp < settings['dayToSend']) && temp > 0) {
                ok = true
            }

            if (ok) {
                return [matrixRow[0]]
            }
        }
        return []
    })
    let to = massiveNameToSend.join(';');

    if (massiveNameToSend != "") {
        to += ";"
        let options = {
            args: [subject, body, to, frEmail]
        };

        PythonShell.run('main.py', options, function (err, results) {
        });
        showNotification()
    }
}

function saveSettings() {
    const fs = require('fs');

    let a = document.getElementById("Subject").value
    let b = document.getElementById('Body').value
    let c = document.getElementById('timeToSend').value
    let d = document.getElementById('pathToExel').value
    let e = document.getElementById('fromEmail').value

    checkEmailFrom()
    if (a || b || c || d || e) {
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

    } else {
        alert("Заполните все поля!");
        return false;
    }


}

function checkEmailFrom() {
    let {PythonShell} = require('python-shell');

    let frEmail = document.getElementById('fromEmail').value;

    let options = {
        args: [frEmail]
    };

    PythonShell.run('foremail.py', options, function (err, results) {
        if (results == "True") {
        } else {
            alert("Email Не верный проверьте поле")
            document.getElementById("fromEmail").value = ""
        }
    });
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

function autoStartup(checkThis) {
    const fs = require('fs');
    const dataSet = fs.readFileSync('path.json', 'utf8');
    let data = JSON.parse(dataSet)

    let path = data['path'];

    if (checkThis.checked) {
        createStartup(path)
    } else {
        removeStartup()
    }

}

function createStartup(path) {
    let {PythonShell} = require('python-shell');
    let options = {
        args: [path]
    };
    PythonShell.run('createShortcut.py', options, function (err, results) {});
}

function removeStartup() {
    let {PythonShell} = require('python-shell');
    let options = {};
    PythonShell.run('removeShortcut.py', options, function (err, results) {});
}

function checkExcel(){
    exel()
    sendEmail()
}

function autoCheck() {
    const schedule = require('node-schedule')
    let rule = new schedule.RecurrenceRule();

    rule.second = new schedule.Range(0, 59, 5);

    schedule.scheduleJob(rule, function () {
        alert("Work")
    });
}