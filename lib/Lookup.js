
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

    const docs = this.docs[repo];

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

    message.channel.sendMessage(response);
  }

  generateClassSub() {
    return "WIP";
  }

  generateClass(docsClass) {
    const { name, description } = docsClass.directData;
    const properties  = docsClass.props.map(prop => this.generateProperty(prop)).join('\n');
    const methods     = docsClass.methods.map(method => this.generateMethod(method)).join('\n');
    const events      = docsClass.events.map(event => this.generateEvent(event)).join('\n');

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
    const { name, description, returns, params } = docsFunction.directData;
    params = params.map(param => this.generateParam(param)).join(", ");

    return (
      `\`${name}(${params})\`
        ${description}

        returns: \`${returns}\`
      `
    );
  }

  generateEvent(docsEvent) {
    const { name, description, params } = docsEvent.directData;
    params = params.map(param => this.generateParam(param)).join(", ");

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
    const { names } = docsVarType.names;

    return names;
  }

  generateUnknown() {
    return "Could not find entry in docs.";
  }

}


module.exports = Lookup;
