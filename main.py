import win32com.client as win32
import sys

subject = sys.argv[1]
body = sys.argv[2]
to = sys.argv[3]
FromEmail = sys.argv[4]


olApp = win32.Dispatch('Outlook.Application')
olNS = olApp.GetNamespace('MAPI')

# construct email item object
mailItem = olApp.CreateItem(0)
mailItem.Subject = subject
mailItem.BodyFormat = 1

mailItem.Body = body
mailItem.To = to
mailItem.Sensitivity = 2
# optional (account you want to use to send the email)
mailItem._oleobj_.Invoke(*(64209, 0, 8, 0, olNS.Accounts.Item(FromEmail)))

mailItem.Display()
# mailItem.Save()
# mailItem.Send()
