# k-kdesvn

Commands for managing my local clone of the l10n-umbrella repository.

This used to use a local Git repository to track local changes to the checkout of the SVN repository. I will rename this at some point.

## Requirements

- Deno; required packages are then fetched automatically
- Git
- `k-kdesvn pocount` requires `fd`, `pocount`, and `grep`
- `k-kdesvn check` requires `fd`, `msgfmt`, and Pology

# Features

## Log

`k-kdesvn log` is like `git log` except Scripty is excluded, so that I'm actually able to see changes from other translators, as well as changes made directly to the translation repository.

No option is provided.

## Make a new checkout

```sh
k-kdesvn init new-dir --langs zh_TW,ja [--read-only]
```

Then if I want to check out another language:

```sh
k-kdesvn add-language --lang zh_CN new-dir
```

This tries to set up a Lokalize project as well.

If the language has a `trunk6/lokalize-files/terms.tbx` file, that file will be symlinked. 

TODO: also support putting it in `support`

## Day-to-day tools

```sh
# equivalent to
# fd -e po -x msgfmt -o /dev/null --check-format
# plus pology kde checks
# starts from the current folder
k-kdesvn check
```

```sh
# Update the repository and submodules to latest
k-kdesvn update
```

```sh
# pocount stats for the current folder.
k-kdesvn pocount
```
