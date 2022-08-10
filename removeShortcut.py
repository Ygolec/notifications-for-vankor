import sys, os, winshell
from win32com.client import Dispatch

desktop = winshell.startup()
path = os.path.join(desktop, "notifications-for-vankor.lnk")
os.remove(path)