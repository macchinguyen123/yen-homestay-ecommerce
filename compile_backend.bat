@echo off
set "PATH=%SystemRoot%\System32;%SystemRoot%\System32\WindowsPowerShell\v1.0;C:\Program Files\Java\jdk-21\bin;%PATH%"
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
cd /d d:\yen-homestay-ecommerce\springboot
call mvnw.cmd compile -DskipTests
