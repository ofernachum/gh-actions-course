import os
import requests
import time

def ping_url(url, delay, max_trails):
    trails = 0
    
    while trails < max_trails:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f"Website {url} is reachable")
                return True
            
        except requests.ConnectionError:
            print(f"Website {url} is unreachable Retrying in {delay} seconds ...")
            time.sleep(delay)
            trails +=1
            
        except requests.exceptions.MissingSchema:
            print(f"Invalid url format: {url}. Make sure the url has a valid schema")
            return False
            
            
    return False
            
            
    

def run():
    website_url = os.getenv('INPUT_URL')
    delay = int(os.getenv('INPUT_DELAY'))
    max_trails = int(os.getenv('INPUT_MAX_TRAILS'))
    
    website_reachable = ping_url(website_url, delay, max_trails)
    
    if not website_reachable:
        raise Exception (f"Website {website_url} is malformed or unreachable.")
    
    
    print(f"Website {website_url} is reachable")
    
    

if __name__ == "__main__":
    run()
    
