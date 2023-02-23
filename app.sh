#!/bin/bash

sleep 30

sudo yum update -y



sudo amazon-linux-extras enable postgresql14
sudo yum install postgresql-server -y
sudo postgresql-setup initdb
sudo sed -i 's/ident/md5/g' /var/lib/pgsql/data/pg_hba.conf
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
sudo -u postgres psql
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'password123';"



echo "Installing nodejs"
sudo yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash -
sudo yum install -y nodejs
echo "nodejs installed successfully"
echo "$(npm --version) is the version of npm"

 echo "Installing unzip"
 sudo yum install unzip -y
 cd /home/ec2-user/webApp

 mkdir webApp
 sudo cp /tmp/webApp.zip /home/ec2-user/webApp/webApp.zip
 pwd
 ls
 unzip /home/ec2-user/webApp/webApp.zip -d /home/ec2-user/webApp
 ls
 

 cd /home/ec2-user/webApp
 # cd webApp

# sudo cp /tmp/webApp.zip .
# unzip ./webApp.zip

 npm install

sudo mv /tmp/project.service /etc/systemd/system/project.service
sudo systemctl enable project.service
sudo systemctl start project.service

 