# vf-oscars-to-csv

Because I'm tired of hand-copying all these Oscar choices into spreadsheet!!! She's busy, y'all!!!

### Usage

1. Go to [https://www.vanityfair.com/oscars-ballot](https://www.vanityfair.com/oscars-ballot). Fill in the Ballot and "copy link" at the end.

2. Install this CLI with `npm i -g vf-oscars-to-csv`

3. Run this node script, feeding in your url and name of the person whose ballot this is. If you need to output to a custom file, you can use `--output`.

```bash
vf-oscars-to-csv --url="http://vf.com/share/vg87xbtq3em1" --name="Paul Marbach"
```