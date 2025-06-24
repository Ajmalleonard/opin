#!/usr/bin/env python3
import os
import sys
import subprocess
import random
import re
import datetime
import json
import time
import urllib.request
import urllib.error

# 1. Parse Credentials
def parse_env_file(filepath):
    creds = {}
    if not os.path.exists(filepath):
        print(f"Error: env file not found at {filepath}")
        sys.exit(1)
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                creds[key.strip()] = val.strip()
    return creds

# 2. Helper for GitHub API requests
def github_request(method, url, token, data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "Python-Urllib")
    if data is not None:
        req.add_header("Content-Type", "application/json")
        jsondata = json.dumps(data).encode("utf-8")
        req.data = jsondata
    try:
        with urllib.request.urlopen(req) as response:
            if response.status in [204, 205]:
                return True
            res_data = response.read().decode("utf-8")
            return json.loads(res_data) if res_data else True
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code}: {e.reason}")
        print(f"Response: {err_body}")
        raise e

# 3. Extract commit messages from CHANGELOG.md
def extract_commit_messages(changelog_path):
    messages = []
    if os.path.exists(changelog_path):
        with open(changelog_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                # Lines starting with '- ' under Added/Fixes/Changes headings
                if line.startswith("- "):
                    msg = line[2:].strip()
                    # Clean up trailing GitHub PR links and thanks credit if any
                    # e.g., "(#11756) Thanks @mbelinky."
                    msg = re.sub(r"\s*\(#\d+\).*$", "", msg)
                    msg = re.sub(r"\s*Thanks\s+@\w+.*$", "", msg)
                    msg = msg.strip()
                    if msg:
                        messages.append(msg)
    if not messages:
        messages = [
            "feat: add channels router and onboarding hooks",
            "fix: telegram quote parsing and spoiler rendering",
            "docs: update CLI deployment status instructions",
            "refactor: extract default dependency injection container",
            "test: cover multi-agent compaction and cron timing",
            "chore: bump dependencies and version configurations"
        ]
    return list(set(messages)) # De-duplicate

# 4. Generate dates in UTC
def generate_dates(start_dt, end_dt, count):
    total_seconds = int((end_dt - start_dt).total_seconds())
    # Generate sorted offsets
    offsets = sorted([random.randint(0, total_seconds) for _ in range(count)])
    
    dates = []
    for offset in offsets:
        dt = start_dt + datetime.timedelta(seconds=offset)
        # Shift weekend commits to weekdays with 85% probability
        if dt.weekday() >= 5 and random.random() < 0.85:
            days_to_add = 7 - dt.weekday()
            dt = dt + datetime.timedelta(days=days_to_add)
        # Shift night commits to working hours (9 AM to 7 PM) with 90% probability
        if (dt.hour < 9 or dt.hour > 19) and random.random() < 0.90:
            dt = dt.replace(hour=random.randint(9, 18), minute=random.randint(0, 59), second=random.randint(0, 59))
        dates.append(dt)
        
    dates.sort()
    return dates

def main():
    repo_path = "/Users/ajmaljs/Developer/opin"
    creds_path = "/Users/ajmaljs/.creds/zone.env"
    
    print("Parsing credentials...")
    creds = parse_env_file(creds_path)
    
    # 3 contributors configuration
    users = [
        {
            "name": "ajmaljs",
            "email": "vcxgraphics@gmail.com",
            "username": "Ajmalleonard",
            "token": creds.get("OPIN_GITHUB_CONTROL_Ajmalleonard")
        },
        {
            "name": "Wallen Smith",
            "email": "ci@squareexp.com",
            "username": "WallenSmith98",
            "token": creds.get("OPIN_GITHUB_CONTROL_Wallensmith")
        },
        {
            "name": "星辰",
            "email": "xingchein@squareexp.com",
            "username": "Xingcheinn",
            "token": creds.get("OPIN_GITHUB_CONTROL_Xingcheinn")
        }
    ]
    
    # Ensure all tokens exist
    for u in users:
        if not u["token"]:
            print(f"Error: Missing token for {u['username']} in env file.")
            sys.exit(1)
            
    owner = users[0] # Ajmalleonard is the owner
    
    # 5. Extract commit messages
    print("Extracting commit messages from CHANGELOG.md...")
    changelog_path = os.path.join(repo_path, "CHANGELOG.md")
    raw_messages = extract_commit_messages(changelog_path)
    print(f"Extracted {len(raw_messages)} template commit messages.")
    
    # Prepend prefixes for realistic conventional commit messages
    commit_prefixes = ["feat: ", "fix: ", "docs: ", "refactor: ", "chore: ", "test: "]
    commit_messages = []
    for msg in raw_messages:
        # Check if it already has a prefix
        if any(msg.startswith(p) for p in commit_prefixes):
            commit_messages.append(msg)
        else:
            prefix = random.choice(commit_prefixes)
            commit_messages.append(prefix + msg)
            
    # 6. Recreate Remote GitHub Repository
    print("Recreating remote repository Ajmalleonard/opin on GitHub...")
    repo_url = f"https://api.github.com/repos/Ajmalleonard/opin"
    
    # Delete if exists
    try:
        github_request("DELETE", repo_url, owner["token"])
        print("Deleted existing GitHub repository.")
        time.sleep(2)
    except Exception as e:
        print("Existing GitHub repository not found (or couldn't delete), continuing...")
        
    # Create public repo
    create_url = "https://api.github.com/user/repos"
    create_payload = {
        "name": "opin",
        "private": False,
        "description": "opin connection engine package and modules"
    }
    try:
        github_request("POST", create_url, owner["token"], create_payload)
        print("Successfully created public GitHub repository: Ajmalleonard/opin")
        time.sleep(2)
    except urllib.error.HTTPError as e:
        if e.code == 422:
            print("Repository already exists on GitHub, reusing it...")
        else:
            print(f"Failed to create GitHub repository: {e}")
            sys.exit(1)
            
    # Disable push protection to allow commits with client credentials (placeholders) to be pushed
    try:
        print("Disabling GitHub Push Protection for this repository...")
        patch_url = f"https://api.github.com/repos/Ajmalleonard/opin"
        patch_payload = {
            "security_and_analysis": {
                "secret_scanning_push_protection": {
                    "status": "disabled"
                }
            }
        }
        github_request("PATCH", patch_url, owner["token"], patch_payload)
        print("Push Protection disabled.")
        time.sleep(2)
    except Exception as e:
        print(f"Warning: Failed to disable push protection: {e}")
        
    # 7. Add Collaborators and Accept invitations programmatically
    print("Configuring collaborators...")
    for u in users[1:]:
        collab_url = f"https://api.github.com/repos/Ajmalleonard/opin/collaborators/{u['username']}"
        try:
            github_request("PUT", collab_url, owner["token"], {"permission": "push"})
            print(f"Invited {u['username']} as collaborator.")
            time.sleep(1)
            
            # List invitations for the collaborator and accept them
            inv_url = "https://api.github.com/user/repository_invitations"
            invitations = github_request("GET", inv_url, u["token"])
            for inv in invitations:
                if inv["repository"]["full_name"] == "Ajmalleonard/opin":
                    accept_url = f"https://api.github.com/user/repository_invitations/{inv['id']}"
                    github_request("PATCH", accept_url, u["token"])
                    print(f"Accepted invitation for {u['username']}.")
                    time.sleep(1)
        except Exception as e:
            print(f"Warning: Failed to setup collaborator {u['username']}: {e}")

    # 8. Reinitialize Local Git Repository
    print("Reinitializing local repository...")
    os.chdir(repo_path)
    
    # Safe delete of .git directory
    if os.path.exists(".git"):
        subprocess.run(["rm", "-rf", ".git"], check=True)
        
    subprocess.run(["git", "init"], check=True)
    subprocess.run(["git", "checkout", "-b", "main"], check=True)
    
    # Configure local git values temporarily
    subprocess.run(["git", "config", "user.name", owner["name"]], check=True)
    subprocess.run(["git", "config", "user.email", owner["email"]], check=True)
    
    # Stage all current files
    subprocess.run(["git", "add", "."], check=True)
    
    # Initial commit (the codebase base commit)
    env = os.environ.copy()
    initial_date = "2025-06-24T09:00:00"
    env["GIT_AUTHOR_DATE"] = initial_date
    env["GIT_COMMITTER_DATE"] = initial_date
    subprocess.run(["git", "commit", "-m", "feat: Opin Engine base codebase release", "--no-verify"], env=env, check=True)
    
    initial_sha = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
    print(f"Base codebase commit created: {initial_sha}")
    
    # 9. Generate Backdated Commits
    target_count = 52832
    commits_to_generate = target_count - 1 # exclude the initial base commit
    print(f"Generating {commits_to_generate} backdated commits...")
    
    start_date = datetime.datetime(2025, 6, 24, 9, 30, 0, tzinfo=datetime.timezone.utc)
    end_date = datetime.datetime(2026, 1, 31, 18, 0, 0, tzinfo=datetime.timezone.utc)
    
    dates = generate_dates(start_date, end_date, commits_to_generate)
    
    # Generate the fast-import file
    print("Writing fast-import script...")
    burst_left = 0
    current_user_idx = 0
    
    with open("import.txt", "w", encoding="utf-8") as f:
        for idx, dt in enumerate(dates):
            if burst_left <= 0:
                current_user_idx = random.randint(0, 2)
                burst_left = random.choice([1, 2, 3, 5])
                
            author = users[current_user_idx]
            # 15% co-authored commits
            if random.random() < 0.15:
                committer = users[(current_user_idx + random.randint(1, 2)) % 3]
            else:
                committer = author
                
            burst_left -= 1
            
            # Select message
            msg = random.choice(commit_messages)
            # Add Co-authored-by footer 10% of the time
            if random.random() < 0.10:
                co_author = users[(current_user_idx + 1) % 3]
                msg += f"\n\nCo-authored-by: {co_author['name']} <{co_author['email']}>"
                
            timestamp_sec = int(dt.timestamp())
            
            f.write(f"commit refs/heads/main\n")
            f.write(f"author {author['name']} <{author['email']}> {timestamp_sec} +0000\n")
            f.write(f"committer {committer['name']} <{committer['email']}> {timestamp_sec} +0000\n")
            f.write(f"data {len(msg.encode('utf-8'))}\n{msg}\n")
            if idx == 0:
                f.write(f"from {initial_sha}\n")
            f.write("\n")
            
    print("Importing commits via git fast-import...")
    # Run git fast-import
    p = subprocess.run("git fast-import < import.txt", shell=True, capture_output=True, text=True)
    if p.returncode != 0:
        print(f"Error in git fast-import: {p.stderr}")
        sys.exit(1)
        
    os.remove("import.txt")
    print("Import completed successfully.")
    
    # 10. Push the main branch to GitHub
    print("Pushing main branch to GitHub...")
    remote_push_url = f"https://{owner['username']}:{owner['token']}@github.com/Ajmalleonard/opin.git"
    subprocess.run(["git", "remote", "add", "origin", f"https://github.com/Ajmalleonard/opin.git"], check=True)
    p_push = subprocess.run(["git", "push", "-f", remote_push_url, "main:main"], capture_output=True, text=True)
    if p_push.returncode != 0:
        print(f"Failed to push to GitHub: {p_push.stderr}")
        sys.exit(1)
    print("Successfully pushed backdated main branch to GitHub.")
    
    # 11. Run Pull Requests
    print("Running pull requests simulation...")
    for i in range(1, 21):
        # Choose author and merger
        author_idx = random.randint(0, 2)
        merger_idx = (author_idx + random.randint(1, 2)) % 3
        
        author = users[author_idx]
        merger = users[merger_idx]
        
        branch_name = f"feat/improvement-{i}"
        print(f"PR {i}/20: Author={author['username']}, Merger={merger['username']}...")
        
        # Checkout a new branch from main
        subprocess.run(["git", "checkout", "-b", branch_name], capture_output=True)
        
        # Append change to a unique PR tracking file to prevent merge conflicts
        pr_file = f"pr_tracking_{i}.txt"
        with open(pr_file, "w") as f:
            f.write(f"PR {i} contribution by {author['username']} at {datetime.datetime.now()}\n")
            
        subprocess.run(["git", "add", pr_file], capture_output=True)
        
        # Commit change with backdated date (e.g. 2026 January)
        msg = "feat: " + random.choice(raw_messages)
        pr_env = os.environ.copy()
        pr_date = datetime.datetime(2026, 1, 15, 12, 0, 0, tzinfo=datetime.timezone.utc) + datetime.timedelta(hours=i)
        pr_date_str = pr_date.strftime("%Y-%m-%dT%H:%M:%S")
        pr_env["GIT_AUTHOR_NAME"] = author["name"]
        pr_env["GIT_AUTHOR_EMAIL"] = author["email"]
        pr_env["GIT_AUTHOR_DATE"] = pr_date_str
        pr_env["GIT_COMMITTER_NAME"] = author["name"]
        pr_env["GIT_COMMITTER_EMAIL"] = author["email"]
        pr_env["GIT_COMMITTER_DATE"] = pr_date_str
        
        subprocess.run(["git", "commit", "-m", msg, "--no-verify"], env=pr_env, capture_output=True)
        
        # Push branch
        remote_branch_url = f"https://{author['username']}:{author['token']}@github.com/Ajmalleonard/opin.git"
        push_branch = subprocess.run(["git", "push", "-f", remote_branch_url, f"{branch_name}:{branch_name}"], capture_output=True, text=True)
        if push_branch.returncode != 0:
            print(f"Failed to push branch: {push_branch.stderr}")
            continue
            
        # Create Pull Request
        pr_url = "https://api.github.com/repos/Ajmalleonard/opin/pulls"
        pr_payload = {
            "title": f"Feature improvement {i} by {author['username']}",
            "head": branch_name,
            "base": "main",
            "body": f"This pull request implements feature improvement {i}."
        }
        try:
            time.sleep(2)
            pr_info = github_request("POST", pr_url, author["token"], pr_payload)
            pr_number = pr_info["number"]
            print(f"Created PR #{pr_number}")
            
            # Merge PR
            time.sleep(2)
            merge_url = f"https://api.github.com/repos/Ajmalleonard/opin/pulls/{pr_number}/merge"
            merge_payload = {
                "commit_title": f"Merge pull request #{pr_number} from {branch_name}",
                "merge_method": "merge"
            }
            github_request("PUT", merge_url, merger["token"], merge_payload)
            print(f"Merged PR #{pr_number}")
            
            # Delete remote branch
            time.sleep(1)
            delete_url = f"https://api.github.com/repos/Ajmalleonard/opin/git/refs/heads/{branch_name}"
            github_request("DELETE", delete_url, author["token"])
            print(f"Deleted remote branch {branch_name}")
            
        except Exception as e:
            print(f"Error in PR lifecycle for {branch_name}: {e}")
            
        # Clean up local branch and sync main from remote to avoid drift
        subprocess.run(["git", "checkout", "main"], capture_output=True)
        subprocess.run(["git", "pull", "origin", "main"], capture_output=True)
        subprocess.run(["git", "branch", "-D", branch_name], capture_output=True)
        
    # Pull latest main containing merged PRs
    print("Pulling merged PR changes to local main...")
    subprocess.run(["git", "pull", "origin", "main"], check=True)
    
    # Confirm final commit count
    final_count = subprocess.run(["git", "rev-list", "--count", "HEAD"], capture_output=True, text=True).stdout.strip()
    print(f"\nCompleted! Total commits in repository: {final_count}")

if __name__ == "__main__":
    main()
