
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

    let lookup = params.join(" ").split(".");
    let lookupClass = docs.classes.get(lookup[0]);
    let lookupSub   = lookup[1];

    if (lookupClass && lookupSub) {
      const { props, methods, events } = lookupClass;

      lookupSub = props.get(lookupSub) || methods.get(lookupSub) || events.get(lookupSub) || null;
    }

    let response;

    if (lookupClass && lookupSub) {
      response = this.generateClassSub(lookupClass, lookupSub);
    }
    else if (lookupClass) {
      response = this.generateClass(lookupClass);
    }
    else {
      response = this.generateUnknown();
    }

    console.log(response);

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
    const { name, description, type } = docsMember.directData;

    return this.format(`
      \`${name}\`
        ${description}

        type: \`${type}\`
      `
    );
  }

  generateFunction(docsFunction) {
    const { name, description, returns } = docsFunction.directData;
    const params = docsFunction.directData.params.map(param => this.generateParam(param)).join(", ");

    return this.format(`
      \`${name}\`(${params})
        ${description}

        returns: \`${returns}\`
      `
    );
  }

  generateEvent(docsEvent) {
    const { name, description } = docsEvent.directData;
    const params = docsEvent.directData.params.map(param => this.generateParam(param)).join(", ");

    return this.format(`
      \`${name}\`
        ${description}

        params: ${params}
      `
    );
  }

  generateParam(docsParam) {
    const { name, type } = docsParam.directData;

    return `\`${this.generateVarType(type)} ${name}\``;
  }

  generateVarType(docsVarType) {
    const { names } = docsVarType.directData;

    return `\`${(typeof names === "object" ? names.constructor.type : names)}\``;
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

}


module.exports = Lookup;
