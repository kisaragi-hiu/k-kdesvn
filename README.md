# k-kdesvn

Commands for managing my checkout of the KDE Subversion repository.

I use Git locally to track local changes.

## Requirements

- Deno; required packages are then fetched automatically
- the `svn` cli
- Git
- `k-kdesvn pocount` requires `fd`, `pocount`, and `grep`
- `k-kdesvn check` requires `fd` and `msgfmt`
- `k-kdesvn msg` requires `xclip` and being on X11

# Features

## Log

`k-kdesvn log` is like `svn log` except Scripty is excluded, so that I'm actually able to see changes from other translators, as well as changes made directly to the translation repository.

By default this shows the output of `svn log` in the current folder, fetching info for the 100 most recent revisions but then filtering out revisions made by Scripty.

## Make a new checkout

```sh
k-kdesvn clone new-dir --langs zh_TW,ja [--read-only]
```

Then if I want to check out another language:

```sh
cd new-dir
k-kdesvn checkout-language zh_CN
```

I haven't automated setting up Lokalize yet.

## Day-to-day tools

```sh
# equivalent to
# fd -e po -x msgfmt -o /dev/null --check-format
# starts from the current folder
k-kdesvn check
```

```sh
# Pull new changes from svn with svn update
# then update the local Git repository to contain the new files
# equivalent to
# svn update; git add .; git commit -m before
# Assumes we're at the root of the checkout.
k-kdesvn update
```

```sh
# Copy the latest Git commit message to clipboard..
# I use Git to track local changes and describe changes in a Git commit, then
# copy that commit message to SVN afterwards. This allows me to simply paste
# it into the editor after running svn commit.
# Frankly I do this in Magit more often instead of using this command.
k-kdesvn msg
```

```sh
# pocount stats for the current folder.
k-kdesvn pocount
```
