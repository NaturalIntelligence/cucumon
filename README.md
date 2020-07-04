# Cucumon
Gherkin like feature file parser with a dash of lemon.
<img align="center" src="assets/logo.png">

## How to use

```bash
$ npm install cucumon
```

```js
const Cucumon = require("cucumon");

const options = {
    tagExpression : "", //@focus
    //clubBgSteps : true,
}
const cucumonSlice = new Cucumon(options);

cucumonSlice.parseFile(featureFileStream);
//or
const output = cucumonSlice.parse(featureFileAsString)
```

### Events

```js
cucumonSlice.on("feature", (sectionObject) => {

})
```

Following events are supported;

* feature
* rule
* scenario
* example
* step
* background
* end
* error

If you pass a stream you can also register for `end` and `error` events.

Error object also contains line number separately.

## Documentation

* Read [documentation](./documentation.md) for more detail.
* Check [bexp](https://github.com/NaturalIntelligence/bexp/) for tag expression.