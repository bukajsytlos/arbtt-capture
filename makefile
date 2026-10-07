.PHONY: all check schemas clean

all: schemas

schemas:
	glib-compile-schemas schemas

check:
	gjs -m test/testArbtt.js

clean:

