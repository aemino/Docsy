
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
      console.log("sending chunk");
      message.channel.sendMessage(chunk);
    });
  }

  generateClassSub() {
    return "WIP";
  }

  generateClass(docsClass) {
    const { name, description } = docsClass.directData;
    const properties  = [...docsClass.props.values()].map(prop => this.generateProperty(prop)).join('\n');
    const methods     = [...docsClass.methods.values()].map(method => this.generateFunction(method)).join('\n');
    const events      = [...docsClass.events.values()].map(event => this.generateEvent(event)).join('\n');

    return (
      `**${name}**
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

  generateProperty(docsProp) {
    const { name, description, type } = docsProp.directData;

    return (
      `\`${name}\`
        ${description}

        type: \`${type}\`
      `
    );
  }

  generateFunction(docsFunction) {
    const { name, description, returns } = docsFunction.directData;
    const params = docsFunction.directData.params.map(param => this.generateParam(param)).join(", ");

    return (
      `\`${name}(${params})\`
        ${description}

        returns: \`${returns}\`
      `
    );
  }

  generateEvent(docsEvent) {
    const { name, description } = docsEvent.directData;
    const params = docsEvent.directData.params.map(param => this.generateParam(param)).join(", ");

    return (
      `\`${name}\`
        ${description}

        params: ${params}
      `
    );
  }

  generateParam(docsParam) {
    const { name } = docsParam.directData;

    return name;
  }

  generateVarType(docsVarType) {
    const { names } = docsVarType.directData;

    return names;
  }

  generateUnknown() {
    return "Could not find entry in docs.";
  }

}


module.exports = Lookup;
