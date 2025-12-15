#!/usr/bin/env python3
"""
Advanced Fruit Detection Web Application
Run this file to start the web server
"""

import os
import sys

def install_requirements():
    """Install required packages"""
    os.system('pip install --upgrade pip')
    os.system('pip install -r requirements.txt --no-cache-dir')

def main():
    print("Starting Advanced Fruit Detection App...")
    print("Open http://localhost:5000 in your browser")
    print("Press Ctrl+C to stop\n")
    
    from app import app
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)

if __name__ == '__main__':
    main()