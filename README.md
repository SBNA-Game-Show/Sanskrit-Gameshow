# Sanskrit-Gameshow
Sanskrit Gameshow Documentation:
https://docs.google.com/document/d/1y9AqemQoLbCJDlFvv1zpL788Pp7I6hgRk34ImQU0dZk/edit?usp=sharing

Commands to run the Playwright Tests:
1) npm run test:frontend
2) npm run test:backend
3) npm run test:all

#Vercel + Render Deployment Info
This project automatically deploys to Vercel (frontend) and Render (backend) whenever new code is pushed to the main branch.

 
# 🚀Automatic Deployment Behavior
Whenever you push new commits to main:
1) GitHub Actions runs all automated tests.
2) If the tests pass, the workflow synchronizes main → release-branch.
3) The release-branch update triggers:
   a) Render backend redeployment (via Deploy Hook)
   b) Vercel frontend redeployment (tracking the release branch)
➡ Both backend and frontend redeploy every time you update main.

⏳ Deployment Wait Time
After pushing code to main, you must wait:
⚠️ Minimum Recommended Wait: 8 minutes

Why?
Render backend takes time to build and boot up (especially Free Tier).
Vercel redeploys almost instantly, but depends on the backend being ready.
Render free instances may also “spin down” after inactivity and need a cold start.


#▶️ How to Play the Game Immediately (without waiting for full redeploy)
If you only want to test or play the game right after a push, you can manually wake the backend first.

1️⃣ Start the Backend (Render)
Click this link:
https://sanskrit-gameshow-huyd.onrender.com

Wait until the page loads.
This wakes the backend instance (cold starts can take ~30–60 seconds).

2️⃣ Open the Game (Vercel)
Once backend is awake, open:
https://sanskrit-gameshow-pi.vercel.app
You can now play instantly


