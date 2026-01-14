@echo off
REM Apply Bureau Backend - Git Push Script (Windows)
REM Prepares and pushes code to GitHub

echo ========================================
echo Apply Bureau Backend - Git Push Script
echo ========================================
echo.

REM Run final check
echo Running final system check...
node final-check.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo System check failed. Please fix errors before pushing.
    pause
    exit /b 1
)

echo.
echo System check passed
echo.

REM Check git status
echo Checking git status...
git status

echo.
set /p CONFIRM="Do you want to commit and push these changes? (y/n): "

if /i not "%CONFIRM%"=="y" (
    echo Push cancelled.
    pause
    exit /b 0
)

REM Add all changes
echo.
echo Adding changes to git...
git add .

REM Commit
echo.
set /p COMMIT_MSG="Enter commit message: "

if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=Backend updates and fixes
)

git commit -m "%COMMIT_MSG%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Commit failed
    pause
    exit /b 1
)

echo Changes committed

REM Push
echo.
echo Pushing to GitHub...
git push origin master

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Push failed
    echo You may need to set up your remote repository:
    echo git remote add origin ^<your-repo-url^>
    pause
    exit /b 1
)

echo.
echo ========================================
echo Successfully pushed to GitHub!
echo ========================================
echo.
echo Your backend is now on GitHub and ready for deployment.
echo.
pause
