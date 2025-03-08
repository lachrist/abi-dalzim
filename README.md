
# Abi-Dalzim

A tool for sharing training sessions.

```
https://lachrist.github.io/abi-dalzim/?set=3%20*%2030s%20burpee
```

Syntax for defining training session:

```
SUM := TERM ('+' TERM)*
TERM := REPETITION
      | PRIMARY
REPETITION := NUMBER '*' PRIMARY
PRIMARY := '(' SUM ')'
         | ATOM
ATOM := DURATION NAME
      | NUMBER NAME 'in' DURATION
```

Example:

```
3 * (
  10 * 30s burpee +
  5 * 10 pushup in 20s
) 
```
