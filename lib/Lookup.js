
"use strict";


class Lookup {

  constructor(data, docs) {
    this.data = data;
    this._docs = docs;
  }

  get docs() {
    return this._docs.docs;
  }

  respond(message, params) {
    const repo = this.data.channels[message.channel.id];
    if (!repo) return;

    const docs = this.docs[repo.repo];
    const classes = this.lowerCaseKeys(docs.classes);

    let lookup = params.join(" ").split(".");
    let lookupClass = lookup[0] ? lookup[0].toLowerCase() : undefined;
    let lookupSub   = lookup[1] ? lookup[1].toLowerCase() : undefined;

    lookupClass = classes.get(lookupClass);

    if (lookupClass && lookupSub) {
      let { props, methods, events } = lookupClass;
      props   = this.lowerCaseKeys(props);
      methods = this.lowerCaseKeys(methods);
      events  = this.lowerCaseKeys(events);

      lookupSub = props.get(lookupSub) || methods.get(lookupSub) || events.get(lookupSub) || null;
    }

    let response;

    if (lookup[0] && lookup[0].toLowerCase() === "help") {
      response = this.generateHelp(docs);
    }
    else if (lookupClass && lookupSub) {
      response = this.generateClassSub(lookupClass, lookupSub);
    }
    else if (lookupClass) {
      response = this.generateClass(lookupClass);
    }
    else {
      response = this.generateUnknown();
    }

    function chunkString(str, count) {
      var chunks = [];
      for (var i = 0; i < str.length; i += count) {
        chunks.push(str.substr(i, count));
      }
      return chunks;
    }

    chunkString(response, 2000).forEach((chunk) => {
      message.channel.sendMessage(chunk);
    });
  }

  generateHelp(docs) {
    const classes = docs.classes.keys().map(docsClass => `\`${docsClass.directData.name}\``).join(', ');

    return this.format(`
      **Classes**
      ${classes}
      `
    );
  }

  generateClassSub(docsClass, docsSub) {
    let info;

    if (docsSub.constructor.name === "DocumentedMember")
      info = this.generateMember(docsSub);

    if (docsSub.constructor.name === "DocumentedFunction")
      info = this.generateFunction(docsSub);

    if (docsSub.constructor.name === "DocumentedEvent")
      info = this.generateEvent(docsSub);

    return (
      info
    );
  }

  generateClass(docsClass) {
    const { name, description } = docsClass.directData;
    const properties  = [...docsClass.props.values()].map(prop => `\`${prop.directData.name}\``).join(', ');
    const methods     = [...docsClass.methods.values()].map(method => `\`${method.directData.name}\``).join(', ');
    const events      = [...docsClass.events.values()].map(event => `\`${event.directData.name}\``).join(', ');

    return this.format(`
      **${name}**
        *${description}*

      **Properties**
      ${properties}

      **Methods**
      ${methods}

      **Events**
      ${events}
      `
    );
  }

  generateMember(docsMember) {
    const { memberof, name, description } = docsMember.directData;
    const type = this.generateVarType(docsMember.directData.type);

    return this.format(`
      \`${memberof}.${name}\`

        ${description}

        **type:** ${type}
      `
    );
  }

  generateFunction(docsFunction) {
    const { memberof, name, description } = docsFunction.directData;
    const returns = this.generateVarType(docsFunction.directData.returns);
    const params  = docsFunction.directData.params.map(param => this.generateParam(param)).join(", ");

    return this.format(`
      \`${memberof}.${name}\`(${params})

        ${description}

        **returns:** ${returns}
      `
    );
  }

  generateEvent(docsEvent) {
    const { memberof, name, description } = docsEvent.directData;
    const params = docsEvent.directData.params.map(param => this.generateParam(param)).join(", ");

    return this.format(`
      \`${memberof}.${name}\`

        ${description}

        **params:** ${params}
      `
    );
  }

  generateParam(docsParam) {
    const { name, type } = docsParam.directData;

    return `\`${type.directData.names.join(", ")} ${name}\``;
  }

  generateVarType(docsVarType) {
    const { names } = docsVarType.directData;

    return `${names.map(name => `\`${name}\``).join(", ")}`;
  }

  generateUnknown() {
    return "Could not find entry in docs.";
  }

  format(string) {
    let whitespace = string.match(/^(\s+)/)[0];

    let lines = string.split('\n');
    let reformattedLines = [];

    lines.forEach((line) => {
      reformattedLines.push(line.replace(whitespace, '').replace(new RegExp('  ', 'g'), ' '));
    });

    return reformattedLines.join('\n');
  }

  lowerCaseKeys(map) {
    let modifiedMap = new Map();

    for (let [key, value] of map) {
      modifiedMap.set(key.toLowerCase(), value);
    }

    return modifiedMap;
  }

}


module.exports = Lookup;
