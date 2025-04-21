#!/usr/bin/env bash

echo "NodeJS will be installed if not present"
echo "sudo password will be required"

USES_APT=$(which apt | grep -w "apt" | wc -l)
USES_RPM=$(which rpm | grep -w "rpm" | wc -l)

if [ $USES_APT -eq 1 ]; then 
	curl -fsSL https://deb.nodesource.com/setup_lts.x -o nodesource_setup.sh
	sudo -E bash nodesource_setup.sh
	sudo apt-get install -y nodejs

elif [ $USES_RPM -eq 1 ]; then
	curl -fsSL https://rpm.nodesource.com/setup_lts.x -o nodesource_setup.sh
	sudo bash nodesource_setup.sh
	sudo yum install -y nodejs
fi

echo "Done"
echo ""
