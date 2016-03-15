# tslide

> Terminal SlideDeck (for back end devs)

![Screenshot](screenshot.png)

---

Controls: 
  * Left, Right: change slide.
  * Ctrl-C     : exit

---

# Usage

```
tslide README.markdown
```

each slide is a section of a markdown document.

"sections" are split at lines that start with `#`

---

## crude js syntax highlighting

``` js
function didItWork() {

  //wahey!
}

```

on by default, disable via `--no-highlight`

---

# images

[iTerm 2](https://www.iterm2.com) users can 
take advantage of [its inline image feature](https://www.iterm2.com/images.html) and use 
images in your slides.

This feature is enabled by default. To disable it, just launch 
the program with `--no-images`.

---

## Why?

Because I am the sort of guy who will write his own 
presentation software two hours before his talk.

---

## License

MIT

---

## Any Questions?

direct your queries to:

`/^(@|https://github.com/|http://)?dominictarr(.com)?$/`
