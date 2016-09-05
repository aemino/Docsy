
"use strict";

const config = require('../config');


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

    if (!docs) {
      return message.channel.sendMessage(`${config.emojis.cog} Documentation not yet loaded. Please wait...`);
    }

    const classes    = this.lowerCaseKeys(docs.classes);
    const interfaces = this.lowerCaseKeys(docs.interfaces);
    const typedefs   = this.lowerCaseKeys(docs.typedefs);

    let lookup = params.join(" ").split(".");
    let lookupClass = lookup[0] ? lookup[0].toLowerCase() : undefined;
    let lookupSub   = lookup[1] ? lookup[1].toLowerCase() : undefined;

    lookupSub = lookupSub.replace('()', '');

    lookupClass = classes.get(lookupClass) || interfaces.get(lookupClass) || typedefs.get(lookupClass) || null;

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
    else if (lookupClass && lookupSub === undefined) {
      if (["DocumentedClass", "DocumentedInterface"].indexOf(lookupClass.constructor.name) > -1)
        response = this.generateClass(lookupClass);

      if (lookupClass.constructor.name === "DocumentedTypeDef")
        response = this.generateTypeDef(lookupClass);
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
    const classes    = [...docs.classes.values()].map(docsClass => `\`${docsClass.directData.name}\``).join(', ');
    const interfaces = [...docs.interfaces.values()].map(docsInterface => `\`${docsInterface.directData.name}\``).join(', ');
    const typedefs   = [...docs.typedefs.values()].map(docsTypeDef => `\`${docsTypeDef.directData.name}\``).join(', ');

    return this.format(`
      **Classes**
      ${classes}

      **Interfaces**
      ${interfaces}

      **Typedefs**
      ${typedefs}
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
    const { name, description, classdesc } = docsClass.directData;
    const construct = docsClass.classConstructor ?
                      docsClass.classConstructor.directData.params.map(param => this.generateParam(param)).join(', ') :
                      "none";
    const properties  = [...docsClass.props.values()].map(prop => `\`${prop.directData.name}\``).join(', ');
    const methods     = [...docsClass.methods.values()].map(method => `\`${method.directData.name}\``).join(', ');
    const events      = [...docsClass.events.values()].map(event => `\`${event.directData.name}\``).join(', ');

    return this.format(`
      **${name}**
      ${description || classdesc}

      **Constructor**
      ${construct}

      **Properties**
      ${properties}

      **Methods**
      ${methods}

      **Events**
      ${events}
      `
    );
  }

  generateTypeDef(docsTypeDef) {
    const { name, description } = docsTypeDef.directData;
    const type = this.generateVarType(docsTypeDef.directData.type);

    return this.format(`
    **${name}**
    ${description}

    **type:** ${type}
    `
  );
  }

  generateMember(docsMember) {
    const { memberof, name, description, type, returns } = docsMember.directData;

    let typeName
        , types;

    if (type.directData) {
      typeName = "type";
      types = this.generateVarType(docsMember.directData.type);
    }
    else if (returns) {
      typeName = "returns";
      types = returns.map(returns => `${returns.type.names.map(name => `\`${name}\``)}`).join(', ');
    }

    return this.format(`
      \`${memberof}.${name}\`

        ${description}

        **${typeName}:** ${types}
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
    if (!docsVarType.directData) {
      return `\`null\``;
    }

    let { names } = docsVarType.directData;

    if (!names) {
      names = docsVarType.names;
    }

    return `${names.map(name => `\`${name}\``).join(", ")}`;
  }

  generateUnknown() {
    return "Could not find entry in docs.";
  }

  format(string) {
    let whitespace = string.match(/^(\s+)/)[0].replace('\n', '');

    let lines = string.split('\n');
    let reformattedLines = [];

    let disabled = false;
    lines.forEach((line) => {
      if (line.includes('```'))
        disabled = !disabled;

      if (disabled)
        return reformattedLines.push(line);

      reformattedLines.push(line.replace(whitespace, ''));
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
