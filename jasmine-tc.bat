echo off

set baserepopath=c:\_git\jstestutilities

cd %baserepopath%

set jsrunpath=%baserepopath%\test\lib\phantom-jasmine\run-jasmine.js

set jsspecpath=%baserepopath%\test\AllTests.html

phantomjs --disk-cache=false %jsrunpath% %jsspecpath%
if %errorlevel% equ 0 goto skipretry

goto success

:jasminefailed
	exit /B 1

:success
	exit /B 0


