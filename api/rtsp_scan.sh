#!/bin/bash

# Function to install necessary dependencies
install_dependencies() {
    echo "Installing dependencies..."
    sudo apt update
    sudo apt install -y nmap net-tools
}

# Function to find subnets
find_subnets() {
    # This function finds the subnets associated with your physical network interfaces
    # It excludes loopback, virtual, and docker interfaces

    # List all network interfaces except loopback and docker/virtual interfaces
    local interfaces=$(ip -br link | awk '$1 !~ /^lo|docker|veth|br-|virbr/ {print $1}')

    # Loop through each interface to find its subnet
    for interface in $interfaces; do
        # Get the IP address and subnet mask for each interface
        ip -4 addr show $interface | grep -oP '(?<=inet\s)\d+(\.\d+){3}/\d+' | while read -r subnet; do
            echo "$subnet"
        done
    done
}


# Function to scan a given subnet
scan_subnet() {
    local subnet=$1
    echo "Scanning subnet $subnet..."

    # Run Nmap with Grepable output, then parse to list hosts with open port 554
    nmap -p 554 --open -oG - $subnet | grep '/open/' | awk '{ print $2 }' | while read -r host; do
        echo "rtsp://admin:admin@$host:554"
    done
}


# Main execution
main() {
    #install_dependencies
    find_subnets | while read -r subnet; do
        scan_subnet "$subnet"
    done
}

main

