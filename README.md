# Sanskrit-Gameshow
Git Cheat Sheet — Key Concepts and Commands
1. What is Git?
Git is a distributed version control system (VCS) used to track changes in source code. Each developer has a full copy of the repository (unlike centralized systems like SVN).
2. Versioning
Version control helps track who changed what and when, roll back to previous versions, and collaborate safely.
Example Commands
git log               # Show commit history
git diff              # Show changes not yet staged
git show <commit-id>  # View specific commit details
3. Distributed VCS
Every developer has a full local repository. Changes are merged and synchronized via push and pull with remote repos like GitHub.
Common Commands
git clone <repo-url>
git fetch
git pull
git push origin main
4. Branching
Branches let you work on new features without disturbing the main code.
Branch Commands
git branch
git branch <branch-name>
git checkout <branch-name>
git checkout -b <branch-name>
git merge <branch-name>
git branch -d <branch-name>
5. Fork vs Branch vs Pull Request
Branch → work independently within same repo
Fork → personal copy of another’s repo
Pull Request → request to merge your changes into another branch or repo
Fork & PR Flow
1. Fork repo
2. Clone fork: git clone https://github.com/<user>/<repo>.git
3. Create branch: git checkout -b feature/update-readme
4. Commit: git add . && git commit -m 'Updated README'
5. Push: git push origin feature/update-readme
6. Create PR on GitHub
6. Commands to Make and Push Changes
git status
git add .
git commit -m 'Message'
git push origin <branch>
git push --set-upstream origin <branch>
7. Tags
Tags mark important points in history, usually for releases.
Tag Commands
git tag
git tag v1.0
git tag -a v1.0 -m 'Version 1.0'
git show v1.0
git push origin v1.0
git push origin --tags
8. Git Hooks
Git hooks are scripts that run automatically on git events.
Common hooks: pre-commit, commit-msg, pre-push, post-merge
