import os
import requests
import time

# This function append a key value line to a file.
# It is later used to append an Output key=value line to the $GITHUB_OUTPUT file below (C45)
def set_output(file_path, key, value):
    with open(file_path, 'a') as file:
        print(f'{key}={value}', file=file)
        


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
    
    # Using the set_output function declared above (C45) to add a line
    # to $GITHUB_OUTPUT file: url-reachable=false/true
    # The key must match the Output defined in the outputs block in action.yaml !
    set_output(os.getenv('GITHUB_OUTPUT'), 'url-reachable', website_reachable)
    
    
    if not website_reachable:
        raise Exception (f"Website {website_url} is malformed or unreachable.")
    
    
    print(f"Website {website_url} is reachable")
    
    

if __name__ == "__main__":
    run()
    
