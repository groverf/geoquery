#!/bin/sh

# Clean N3 datafiles prior to loading into Parliament

#
# Assumes that files are currently named *.N3
#
# Step 1: combine files into one
cat NHD*.N3 > allnhddata.n3
wc -l allnhddata.n3
... TNM ...

# Step 2: clean up data
# remove trailing blanks from URIs
sed 's/ >/>/g' <alltnmdata.n3 >cleantnmdata.n3

# Step 3: sort data & remove duplicates
sort -u < allnhddata.n3 > sortnhddata.n3
wc -l sortnhddata.n3
sort -u < cleantnmdata.n3 > sorttnmdata.n3
wc -l sorttnmdata.n3

# Step 4: remove rdfs:#asWKT triples
grep -v rdf#asWKT sortnhddata.n3 > reducednhddata.n3
wc -l reducedtnmdata.n3
...TNM...


