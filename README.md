# handyServer

## install

`npm i -g hserve`

## usage

```bash
Usage: hserve PATH [OPTIONS]

Options:
  --version   Show version number                                      [boolean]
  -d, --dir   relative path to serve                     [string] [default: "."]
  -m, --mock  relative path to mock                     [string] [default: null]
  -p, --port  port the service on                     [string] [default: "3000"]
  -l, --log   whether it should print log             [boolean] [default: false]
  -h, --help  Show help                                                [boolean]

Examples:
  hserve                            serve current-folder, at the port 3000.
  hserve ..                         serve parent-folder, at the port 3000.
  hserve /var/www/html -l           serve the folder "/var/www/html" with logs,
                                    at the port 3000.
  hserve /var/www -d my_blog -p 80  serve the folder "/var/www/my_blog", at the
                                    port 80.
  hserve /var/www -m mock           serve the folder "/var/www/" and mock the
                                    folder "/var/www/mock", at the 3000.

Copyright 2018
```
