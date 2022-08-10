import sys, os, winshell
from win32com.client import Dispatch

pathToApp = sys.argv[1]

desktop = winshell.startup()
path = os.path.join(desktop, "notifications-for-vankor.lnk")
target = pathToApp
icon = pathToApp
shell = Dispatch('WScript.Shell')
shortcut = shell.CreateShortCut(path)
shortcut.Targetpath = target
shortcut.arguments = "/m"
shortcut.IconLocation = icon
shortcut.save()
