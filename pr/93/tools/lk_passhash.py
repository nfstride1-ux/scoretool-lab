# Makes the Lingkana scoring passcode check values for lingkana.js (LK_PASS_SALT, LK_PASS_DK).
# The passcode itself is never stored in the repo. Usage: python3 tools/lk_passhash.py   (type the passcode at the prompt)
# Then paste the two printed lines over the ones in lingkana.js and rebuild sw.js.
import getpass,hashlib,os,sys
ITER=600000
pw=sys.stdin.readline().rstrip('\n') if not sys.stdin.isatty() else getpass.getpass('Lingkana passcode: ')
if not pw:sys.exit('No passcode typed.')
salt=os.urandom(16).hex()
dk=hashlib.pbkdf2_hmac('sha256',pw.encode('utf-8'),bytes.fromhex(salt),ITER,32).hex()
print("const LK_PASS_SALT='%s';"%salt)
print("const LK_PASS_DK='%s';"%dk)
