#!/bin/bash

# check if the -v flag is present
if [[ $1 == "-v" ]]; then
    VERBOSE=1
else
    VERBOSE=0
fi

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
            # check if the subnet is bigger than /24 first
            # first 
            echo "$subnet"
        done
    done
}


# Function to scan a given subnet
scan_subnet() {
    local subnet=$1

    # parse the subnet string, which looks like "192.168.1.7/16" into base and mask
    local base=$(echo "$subnet" | cut -d '/' -f 1)
    local mask=$(echo "$subnet" | cut -d '/' -f 2)

    # If the mask is smaller than /24, we'll want to use a faster scan
    # Otherwise, we'll use a slower but more reliable scan
    if [[ $mask -lt 24 ]]; then
        if [[ $mask -lt 22 ]]; then
            # Limit size of scan
            mask=22
            if [[ $VERBOSE -eq 1 ]]; then
                echo "Limiting subnet $subnet to /$mask so scan doesn't take forever."
                echo "For a full scan, run 'nmap -T4 -p 554 --open -oG - $subnet'"
            fi
        fi
        # T5 is "insane" and super fast, but can be unreliable.  (e.g. 5s for /22)
        # Limiting to T4 since that finds things reliably for me.
        SPEED=-T4
    else
        # It's 24 or less, so use a fast but reliable scan
        SPEED=-T4
    fi
    # re-assamble the subnet string
    subnet="$base/$mask"
    if [[ $VERBOSE -eq 1 ]]; then
        echo "Scanning subnet $subnet at speed $SPEED"
    fi

    # T5 is "insane" and super fast, but perhaps unreliable.  (e.g. 5s for /22)
    # T4 is safer, but much slower.  (e.g. 26s for /22)
    SPEED=-T5

    # Run Nmap with Grepable output, then parse to list hosts with open port 554
    nmap $SPEED -p 554 --open -oG - $subnet | grep '/open/' | awk '{ print $2 }' | while read -r host; do
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

