echo off

echo .

set baserepopath=c:\_git\jstestutilities

cd %baserepopath%

set jsrunpath=%baserepopath%\test\lib\phantom-jasmine\run-jasmine.js
set jsspecpath=test\AllTests.html
echo jsrunpath  : %jsrunpath%
echo jsspecpath : %jsspecpath%

phantomjs --disk-cache=false %jsrunpath% %jsspecpath%
if %errorlevel% equ 0 goto success

goto success

:jasminefailed
echo *** ERROR *** Jasmine Tests Failed

	exit /B 1

:success
echo +++ SUCCESS +++ Jasmine Tests Succeeded

	exit /B 0


