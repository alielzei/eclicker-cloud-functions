# Python3 code to demonstrate the 
# random generation of string id's 
  
import random 
import string 
  
# Generate a random string 
# with 32 characters. 
random = ''.join([random.choice(string.ascii_letters 
            + string.digits) for n in range(10)]) 
  
# print the random 
# string of length 32 
print (random) 