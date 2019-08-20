# handyServer

## install

`npm i -g hserve`

## usage

### easily server static files

1. cd to the target folder
2. run `hserve` in this folder

### server static files

1. run `hserve serve [options]` in this folder. By default, it works exactly the same as running the `hserve` command directly.

2. options

    |option|alias|need args|desc|default|
    |---|---|---|---|---|
    |--port|-p|True|Set port of hserve|3000|
    |--dir|-d|True|Set the directory of the service, support relative and absolute paths|$PWD|
    |--api|-a|True|Set api-url of static file service|/static|



