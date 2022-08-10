import win32com.client as win32
import sys

outlook_app = win32.gencache.EnsureDispatch('Outlook.Application')
ons = outlook_app.GetNamespace("MAPI")
count1 = outlook_app.Session.Accounts.Count
FromEmail=sys.argv[1]
answer=False

for i in range(1,count1+1):
    if ons.Accounts.Item(i).DisplayName.lower().find(FromEmail) != -1:
        answer=True
print(answer)
sys.stdout.flush()

