# CI Host
Easily host artifacts from your Gitlab CI server.

## Installation

* Go to https://artifacts.paulb.gd to download a zip.
* Extract the zip, and start the server with `npm start`. Stop the server.
* On your Gitlab CI Runner server, install the deploy tool with `npm install -g ci-deploy`
* In your .gitlab-ci.yml file, add the `ci-deploy` section like so:

````yaml
ci-deploy:
  files:
    - '*.json'
````
Inside this section, you can supply a list of files to match and upload. Most glob patterns will work here.

* Then inside your deploy script, add `ci-deploy $CI_PROJECT_ID`
* Start back up the CI Host, and log in as a Gitlab Administrator.
* You're done!

## Uninstalling
* Stop the CI Host, and delete the directory.
* On your Gitlab CI Runner server, run `npm uninstall -g ci-deploy`
* You're done!

Licensed under MIT
