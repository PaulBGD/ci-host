# CI Host
Easily host artifacts from your Gitlab CI server.

## Installation

* Go to https://artifacts.paulb.gd to download a zip.
* Extract the zip, and install the dependencies with `npm install`. Then start the server with `npm start`. Stop the server.
* Go to the Admin Area in Gitlab, click Applications, and then click New Application. Name it whatever, however set the redirect URL path to `/auth/gitlab/callback`. Take the app id and secret key, and put them in your `config.json`.
* Fill out the data URL in the `config.json` file.
* On your Gitlab CI Runner server, install the deploy tool with `npm install -g ci-deploy`.
* Also on your Runner server, run `ci-deploy configure`. Copy this key, and put it as the server key in the `config.json`.
* Create a .ci-deploy.yml file, add the `ci-deploy` section like so:

````yaml
ci-deploy:
  files:
    - '*.json'
````
Inside this section, you can supply a list of files to match and upload. Most glob patterns will work here.

* Then inside your deploy script, add `ci-deploy $CI_BUILD_REPO`.
* Start back up the CI Host, and log in as a Gitlab Administrator.
* You're done!

## Uninstalling
* Stop the CI Host, and delete the directory.
* On your Gitlab CI Runner server, run `npm uninstall -g ci-deploy`
* You're done!

Licensed under MIT
