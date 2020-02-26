/* eslint-env mocha */
import 'babel-polyfill';
import assert from 'assert';

import s from 'underscore.string';

import './client.mocks.js';
import { original } from '../lib/parser/original/original';
import { filtered } from '../lib/parser/filtered/filtered';
import { Markdown } from '../lib/markdown';

const wrapper = (text, tag) => `<span class="copyonly">${ tag }</span>${ text }<span class="copyonly">${ tag }</span>`;
const boldWrapper = (text) => wrapper(`<strong>${ text }</strong>`, '*');
const italicWrapper = (text) => wrapper(`<em>${ text }</em>`, '_');
const strikeWrapper = (text) => wrapper(`<strike>${ text }</strike>`, '~');
const headerWrapper = (text, level) => `<h${ level }>${ text }</h${ level }>`;
const quoteWrapper = (text) => `<blockquote class="background-transparent-darker-before"><span class="copyonly">&gt;</span>${ text }</blockquote>`;
const linkWrapped = (link, title) => `<a href="${ s.escapeHTML(link) }" target="_blank" rel="noopener noreferrer">${ s.escapeHTML(title) }</a>`;
const inlinecodeWrapper = (text) => wrapper(`<span><code class="code-colors inline">${ text }</code></span>`, '`');
const codeWrapper = (text, lang) => `<pre><code class='code-colors hljs ${ lang }'><span class='copyonly'>\`\`\`<br></span>${ text }<span class='copyonly'><br>\`\`\`</span></code></pre>`;

const bold = {
	'*Hello*': boldWrapper('Hello'),
	'**Hello**': boldWrapper('Hello'),
	'**Hello*': boldWrapper('Hello'),
	'*Hello**': boldWrapper('Hello'),
	Hello: 'Hello',
	'*Hello': '*Hello',
	'Hello*': 'Hello*',
	'He*llo': 'He*llo',
	'***Hello***': `*${ boldWrapper('Hello') }*`,
	'***Hello**': `*${ boldWrapper('Hello') }`,
	'*Hello* this is dog': `${ boldWrapper('Hello') } this is dog`,
	'Rocket cat says *Hello*': `Rocket cat says ${ boldWrapper('Hello') }`,
	'He said *Hello* to her': `He said ${ boldWrapper('Hello') } to her`,
	'**Hello** this is dog': `${ boldWrapper('Hello') } this is dog`,
	'Rocket cat says **Hello**': `Rocket cat says ${ boldWrapper('Hello') }`,
	'He said **Hello** to her': `He said ${ boldWrapper('Hello') } to her`,
	'He was a**nn**oyed': `He was a${ boldWrapper('nn') }oyed`,
	'There are two o in f*oo*tball': `There are two o in f${ boldWrapper('oo') }tball`,
};

const italic = {
	_Hello_: italicWrapper('Hello'),
	__Hello__: italicWrapper('Hello'),
	__Hello_: italicWrapper('Hello'),
	_Hello__: italicWrapper('Hello'),
	Hello: 'Hello',
	_Hello: '_Hello',
	Hello_: 'Hello_',
	He_llo: 'He_llo',
	___Hello___: '___Hello___',
	___Hello__: '___Hello__',
	'_Hello_ this is dog': `${ italicWrapper('Hello') } this is dog`,
	'Rocket cat says _Hello_': `Rocket cat says ${ italicWrapper('Hello') }`,
	'He said _Hello_ to her': `He said ${ italicWrapper('Hello') } to her`,
	'__Hello__ this is dog': `${ italicWrapper('Hello') } this is dog`,
	'Rocket cat says __Hello__': `Rocket cat says ${ italicWrapper('Hello') }`,
	'He said __Hello__ to her': `He said ${ italicWrapper('Hello') } to her`,
};

const strike = {
	'~Hello~': strikeWrapper('Hello'),
	'~~Hello~~': strikeWrapper('Hello'),
	'~~Hello~': strikeWrapper('Hello'),
	'~Hello~~': strikeWrapper('Hello'),
	Hello: 'Hello',
	'~Hello': '~Hello',
	'Hello~': 'Hello~',
	'He~llo': 'He~llo',
	'~~~Hello~~~': '~~~Hello~~~',
	'~~~Hello~~': '~~~Hello~~',
	'~Hello~ this is dog': `${ strikeWrapper('Hello') } this is dog`,
	'Rocket cat says ~Hello~': `Rocket cat says ${ strikeWrapper('Hello') }`,
	'He said ~Hello~ to her': `He said ${ strikeWrapper('Hello') } to her`,
	'~~Hello~~ this is dog': `${ strikeWrapper('Hello') } this is dog`,
	'Rocket cat says ~~Hello~~': `Rocket cat says ${ strikeWrapper('Hello') }`,
	'He said ~~Hello~~ to her': `He said ${ strikeWrapper('Hello') } to her`,
};

const headersLevel1 = {
	'# Hello': headerWrapper('Hello', 1),
	'# Rocket.Cat': headerWrapper('Rocket.Cat', 1),
	'# Hi': headerWrapper('Hi', 1),
	'# Hello this is dog': headerWrapper('Hello this is dog', 1),
	'# Rocket cat says Hello': headerWrapper('Rocket cat says Hello', 1),
	'# He said Hello to her': headerWrapper('He said Hello to her', 1),
	'#Hello': '#Hello',
	'#Hello#': '#Hello#',
	'He#llo': 'He#llo',
};

const headersLevel2 = {
	'## Hello': headerWrapper('Hello', 2),
	'## Rocket.Cat': headerWrapper('Rocket.Cat', 2),
	'## Hi': headerWrapper('Hi', 2),
	'## Hello this is dog': headerWrapper('Hello this is dog', 2),
	'## Rocket cat says Hello': headerWrapper('Rocket cat says Hello', 2),
	'## He said Hello to her': headerWrapper('He said Hello to her', 2),
	'##Hello': '##Hello',
	'##Hello##': '##Hello##',
	'He##llo': 'He##llo',
};

const headersLevel3 = {
	'### Hello': headerWrapper('Hello', 3),
	'### Rocket.Cat': headerWrapper('Rocket.Cat', 3),
	'### Hi': headerWrapper('Hi', 3),
	'### Hello this is dog': headerWrapper('Hello this is dog', 3),
	'### Rocket cat says Hello': headerWrapper('Rocket cat says Hello', 3),
	'### He said Hello to her': headerWrapper('He said Hello to her', 3),
	'###Hello': '###Hello',
	'###Hello###': '###Hello###',
	'He###llo': 'He###llo',
};

const headersLevel4 = {
	'#### Hello': headerWrapper('Hello', 4),
	'#### Rocket.Cat': headerWrapper('Rocket.Cat', 4),
	'#### Hi': headerWrapper('Hi', 4),
	'#### Hello this is dog': headerWrapper('Hello this is dog', 4),
	'#### Rocket cat says Hello': headerWrapper('Rocket cat says Hello', 4),
	'#### He said Hello to her': headerWrapper('He said Hello to her', 4),
	'####Hello': '####Hello',
	'####Hello####': '####Hello####',
	'He####llo': 'He####llo',
};

const quote = {
	'&gt;Hello': s.escapeHTML('&gt;Hello'),
	'&gt;Rocket.Cat': s.escapeHTML('&gt;Rocket.Cat'),
	'&gt;Hi': s.escapeHTML('&gt;Hi'),
	'&gt; Hello this is dog': s.escapeHTML('&gt; Hello this is dog'),
	'&gt; Rocket cat says Hello': s.escapeHTML('&gt; Rocket cat says Hello'),
	'&gt; He said Hello to her': s.escapeHTML('&gt; He said Hello to her'),
	'&gt; He said Hello to her ': s.escapeHTML('&gt; He said Hello to her '),
	'&lt;Hello': s.escapeHTML('&lt;Hello'),
	'&lt;Rocket.Cat&gt;': s.escapeHTML('&lt;Rocket.Cat&gt;'),
	' &gt;Hi': s.escapeHTML(' &gt;Hi'),
	'Hello &gt; this is dog': s.escapeHTML('Hello &gt; this is dog'),
	'Roc&gt;ket cat says Hello': s.escapeHTML('Roc&gt;ket cat says Hello'),
	'He said Hello to her&gt;': s.escapeHTML('He said Hello to her&gt;'),
	'>Hello': quoteWrapper('Hello'),
	'>Rocket.Cat': quoteWrapper('Rocket.Cat'),
	'>Hi': quoteWrapper('Hi'),
	'> Hello this is dog': quoteWrapper(' Hello this is dog'),
	'> Rocket cat says Hello': quoteWrapper(' Rocket cat says Hello'),
	'> He said Hello to her': quoteWrapper(' He said Hello to her'),
	'<Hello': s.escapeHTML('<Hello'),
	'<Rocket.Cat>': s.escapeHTML('<Rocket.Cat>'),
	' >Hi': s.escapeHTML(' >Hi'),
	'Hello > this is dog': s.escapeHTML('Hello > this is dog'),
	'Roc>ket cat says Hello': s.escapeHTML('Roc>ket cat says Hello'),
	'He said Hello to her>': s.escapeHTML('He said Hello to her>'),
};

const link = {
	'&lt;http://link|Text&gt;': s.escapeHTML('&lt;http://link|Text&gt;'),
	'&lt;https://open.rocket.chat/|Open Site For Rocket.Chat&gt;': s.escapeHTML('&lt;https://open.rocket.chat/|Open Site For Rocket.Chat&gt;'),
	'&lt;https://open.rocket.chat/ | Open Site For Rocket.Chat&gt;': s.escapeHTML('&lt;https://open.rocket.chat/ | Open Site For Rocket.Chat&gt;'),
	'&lt;https://rocket.chat/|Rocket.Chat Site&gt;': s.escapeHTML('&lt;https://rocket.chat/|Rocket.Chat Site&gt;'),
	'&lt;https://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site&gt;': s.escapeHTML('&lt;https://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site&gt;'),
	'&lt;http://linkText&gt;': s.escapeHTML('&lt;http://linkText&gt;'),
	'&lt;https:open.rocket.chat/ | Open Site For Rocket.Chat&gt;': s.escapeHTML('&lt;https:open.rocket.chat/ | Open Site For Rocket.Chat&gt;'),
	'https://open.rocket.chat/|Open Site For Rocket.Chat': s.escapeHTML('https://open.rocket.chat/|Open Site For Rocket.Chat'),
	'&lt;www.open.rocket.chat/|Open Site For Rocket.Chat&gt;': s.escapeHTML('&lt;www.open.rocket.chat/|Open Site For Rocket.Chat&gt;'),
	'&lt;htps://rocket.chat/|Rocket.Chat Site&gt;': s.escapeHTML('&lt;htps://rocket.chat/|Rocket.Chat Site&gt;'),
	'&lt;ttps://rocket.chat/|Rocket.Chat Site&gt;': s.escapeHTML('&lt;ttps://rocket.chat/|Rocket.Chat Site&gt;'),
	'&lt;tps://rocket.chat/|Rocket.Chat Site&gt;': s.escapeHTML('&lt;tps://rocket.chat/|Rocket.Chat Site&gt;'),
	'&lt;open.rocket.chat/|Open Site For Rocket.Chat&gt;': s.escapeHTML('&lt;open.rocket.chat/|Open Site For Rocket.Chat&gt;'),
	'&lt;htts://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site&gt;': s.escapeHTML('&lt;htts://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site&gt;'),

	'<http://invalid link|Text>': s.escapeHTML('<http://invalid link|Text>'),
	'<http://link|Text>': linkWrapped('http://link', 'Text'),
	'<https://open.rocket.chat/|Open Site For Rocket.Chat>': linkWrapped('https://open.rocket.chat/', 'Open Site For Rocket.Chat'),
	'<https://open.rocket.chat/ | Open Site For Rocket.Chat>': linkWrapped('https://open.rocket.chat/ ', ' Open Site For Rocket.Chat'),
	'<https://rocket.chat/|Rocket.Chat Site>': linkWrapped('https://rocket.chat/', 'Rocket.Chat Site'),
	'<https://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site>': linkWrapped('https://rocket.chat/docs/developer-guides/testing/#testing', 'Testing Entry on Rocket.Chat Docs Site'),
	'<http://linkText>': s.escapeHTML('<http://linkText>'),
	'<https:open.rocket.chat/ | Open Site For Rocket.Chat>': s.escapeHTML('<https:open.rocket.chat/ | Open Site For Rocket.Chat>'),
	'<www.open.rocket.chat/|Open Site For Rocket.Chat>': s.escapeHTML('<www.open.rocket.chat/|Open Site For Rocket.Chat>'),
	'<htps://rocket.chat/|Rocket.Chat Site>': s.escapeHTML('<htps://rocket.chat/|Rocket.Chat Site>'),
	'<ttps://rocket.chat/|Rocket.Chat Site>': s.escapeHTML('<ttps://rocket.chat/|Rocket.Chat Site>'),
	'<tps://rocket.chat/|Rocket.Chat Site>': s.escapeHTML('<tps://rocket.chat/|Rocket.Chat Site>'),
	'<open.rocket.chat/|Open Site For Rocket.Chat>': s.escapeHTML('<open.rocket.chat/|Open Site For Rocket.Chat>'),
	'<htts://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site>': s.escapeHTML('<htts://rocket.chat/docs/developer-guides/testing/#testing|Testing Entry on Rocket.Chat Docs Site>'),

	'[Text](http://invalid link)': '[Text](http://invalid link)',
	'[Text](http://link)': linkWrapped('http://link', 'Text'),
	'[Open Site For Rocket.Chat](https://open.rocket.chat/)': linkWrapped('https://open.rocket.chat/', 'Open Site For Rocket.Chat'),
	'[ Open Site For Rocket.Chat](https://open.rocket.chat/ )': linkWrapped('https://open.rocket.chat/ ', ' Open Site For Rocket.Chat'),
	'[Rocket.Chat Site](https://rocket.chat/)': linkWrapped('https://rocket.chat/', 'Rocket.Chat Site'),
	'[Testing Entry on Rocket.Chat Docs Site](https://rocket.chat/docs/developer-guides/testing/#testing)': linkWrapped('https://rocket.chat/docs/developer-guides/testing/#testing', 'Testing Entry on Rocket.Chat Docs Site'),
	'[](http://linkText)': '[](http://linkText)',
	'[text]': '[text]',
	'[Open Site For Rocket.Chat](https:open.rocket.chat/)': '[Open Site For Rocket.Chat](https:open.rocket.chat/)',
	'[Open Site For Rocket.Chat](www.open.rocket.chat/)': '[Open Site For Rocket.Chat](www.open.rocket.chat/)',
	'[Rocket.Chat Site](htps://rocket.chat/)': '[Rocket.Chat Site](htps://rocket.chat/)',
	'[Rocket.Chat Site](ttps://rocket.chat/)': '[Rocket.Chat Site](ttps://rocket.chat/)',
	'[Rocket.Chat Site](tps://rocket.chat/)': '[Rocket.Chat Site](tps://rocket.chat/)',
	'[Open Site For Rocket.Chat](open.rocket.chat/)': '[Open Site For Rocket.Chat](open.rocket.chat/)',
	'[Testing Entry on Rocket.Chat Docs Site](htts://rocket.chat/docs/developer-guides/testing/#testing)': '[Testing Entry on Rocket.Chat Docs Site](htts://rocket.chat/docs/developer-guides/testing/#testing)',
	'[Text](http://link?param1=1&param2=2)': linkWrapped('http://link?param1=1&param2=2', 'Text'),
};

const inlinecode = {
	'`code`': inlinecodeWrapper('code'),
	'`code` begin': `${ inlinecodeWrapper('code') } begin`,
	'End `code`': `End ${ inlinecodeWrapper('code') }`,
	'Middle `code` middle': `Middle ${ inlinecodeWrapper('code') } middle`,
	'`code`begin': `${ inlinecodeWrapper('code') }begin`,
	'End`code`': `End${ inlinecodeWrapper('code') }`,
	'Middle`code`middle': `Middle${ inlinecodeWrapper('code') }middle`,
};

const code = {
	'```code```': codeWrapper('<span class="hljs-keyword">code</span>', 'clean'),
	'```code': codeWrapper('<span class="hljs-keyword">code</span>\n', 'clean'),
	'```code\n': codeWrapper('<span class="hljs-keyword">code</span>\n', 'clean'),
	'```\ncode\n```': codeWrapper('<span class="hljs-keyword">code</span>\n', 'clean'),
	'```code\n```': codeWrapper('<span class="hljs-keyword">code</span>\n', 'clean'),
	'```\ncode```': codeWrapper('<span class="hljs-keyword">code</span>', 'clean'),
	'```javascript\nvar a = \'log\';\nconsole.log(a);```': codeWrapper('<span class="hljs-keyword">var</span> a = <span class="hljs-string">\'log\'</span>;\n<span class="hljs-built_in">console</span>.log(a);', 'javascript'),
	'```*code*```': codeWrapper('*<span class="hljs-meta">code</span>*', 'armasm'),
	'```**code**```': codeWrapper('**<span class="hljs-meta">code</span>**', 'armasm'),
	'```_code_```': codeWrapper('<span class="hljs-variable">_code_</span>', 'sqf'),
	'```__code__```': codeWrapper('<span class="hljs-strong">__code__</span>', 'markdown'),
};

const nested = {
	'> some quote\n`window.location.reload();`': `${ quoteWrapper(' some quote') }${ inlinecodeWrapper('window.location.reload();') }`,
};

/*
* Markdown Filters
*/
const boldFiltered = {
	'*Hello*': 'Hello',
	'**Hello**': 'Hello',
	'**Hello': 'Hello',
	'*Hello**': 'Hello',
	'He*llo': 'He*llo',
	'*Hello': '*Hello',
	'Hello*': 'Hello*',
	'***Hello***': '***Hello***',
	'***Hello**': '***Hello**',
	'*Hello* there': 'Hello there',
	'**Hello** there': 'Hello there',
	'Hi, *Hello*': 'Hi, Hello',
	'Hi, **Hello**': 'Hi, Hello',
	'Hi, *Hello* how are you?': 'Hi, Hello how are you?',
	'Hi, **Hello** how are you?': 'Hi, Hello how are you?',
};

const italicFiltered = {
	_Hello_: 'Hello',
	__Hello__: 'Hello',
	__Hello: 'Hello',
	_Hello__: 'Hello',
	He_llo: 'He_llo',
	_Hello: '_Hello',
	Hello_: 'Hello_',
	___Hello___: '___Hello___',
	___Hello__: '___Hello__',
	'_Hello_ there': 'Hello there',
	'__Hello__ there': 'Hello there',
	'Hi, _Hello_': 'Hi, Hello',
	'Hi, __Hello__': 'Hi, Hello',
	'Hi, _Hello_ how are you?': 'Hi, Hello how are you?',
	'Hi, __Hello__ how are you?': 'Hi, Hello how are you?',
};

const strikeFiltered = {
	'~Hello~': 'Hello',
	'~~Hello~~': 'Hello',
	'~~Hello': 'Hello',
	'~Hello~~': 'Hello',
	'He~llo': 'He~llo',
	'~Hello': '~Hello',
	'Hello~': 'Hello~',
	'~~~Hello~~~': '~~~Hello~~~',
	'~~~Hello~~': '~~~Hello~~',
	'~Hello~ there': 'Hello there',
	'~~Hello~~ there': 'Hello there',
	'Hi, ~Hello~': 'Hi, Hello',
	'Hi, ~~Hello~~': 'Hi, Hello',
	'Hi, ~Hello~ how are you?': 'Hi, Hello how are you?',
	'Hi, ~~Hello~~ how are you?': 'Hi, Hello how are you?',
};

const headingFiltered = {
	'# Hello': 'Hello',
	'## Hello': 'Hello',
	'### Hello': 'Hello',
	'#### Hello': 'Hello',
	'#Hello': '#Hello',
	'##Hello': '##Hello',
	'###Hello': '###Hello',
	'####Hello': '####Hello',
	'He#llo': 'He#llo',
	'# Hello there': 'Hello there',
	'Hi, # Hello': 'Hi, Hello',
	'Hi, # Hello there': 'Hi, Hello there',
};

const quoteFiltered = {
	'&gt;Hello': 'Hello',
	'&gt; Hello': ' Hello',
	'&lt;Hello': '&lt;Hello',
	' &gt;Hello': ' &gt;Hello',
	'Hello &gt; there': 'Hello &gt; there',
	'>Hello': 'Hello',
	'> Hello': ' Hello',
};

const linkFiltered = {
	'[Text](http://link)': 'Text',
	'[Open Site For Rocket.Chat](https://open.rocket.chat/)': 'Open Site For Rocket.Chat',
	'[ Open Site For Rocket.Chat](https://open.rocket.chat/ )': ' Open Site For Rocket.Chat',
	'[Rocket.Chat Site](https://rocket.chat/)': 'Rocket.Chat Site',
	'<http://link|Text>': 'Text',
	'<http://link|Text for test>': 'Text for test',
};

const inlinecodeFiltered = {
	'`code`': 'code',
	'`code` begin': 'code begin',
	'End `code`': 'End code',
	'Middle `code` middle': 'Middle code middle',
	'`code`begin': 'codebegin',
	'End`code`': 'Endcode',
	'Middle`code`middle': 'Middlecodemiddle',
};

const blockcodeFiltered = {
	'```code```': 'code',
	'```code': 'code',
	'code```': 'code',
	'Here ```code``` lies': 'Here code lies',
	'Here```code```lies': 'Herecodelies',
};

const defaultObjectTest = (result, object, objectKey) => assert.equal(result.html, object[objectKey]);

const testObject = (object, parser = original, test = defaultObjectTest) => {
	Object.keys(object).forEach((objectKey) => {
		describe(objectKey, () => {
			const message = parser === original ? { html: s.escapeHTML(objectKey) } : object[objectKey];
			const result = parser === original ? Markdown.mountTokensBack(parser(message)) : parser(message);

			it(`should be equal to ${ object[objectKey] }`, () => {
				test(result, object, objectKey);
			});
		});
	});
};


describe('Original', function() {
	describe('Bold', () => testObject(bold, original));

	describe('Italic', () => testObject(italic, original));

	describe('Strike', () => testObject(strike, original));

	describe('Headers', () => {
		describe('Level 1', () => testObject(headersLevel1, original));

		describe('Level 2', () => testObject(headersLevel2, original));

		describe('Level 3', () => testObject(headersLevel3, original));

		describe('Level 4', () => testObject(headersLevel4, original));
	});

	describe('Quote', () => testObject(quote, original));

	describe('Link', () => testObject(link, original));

	describe('Inline Code', () => testObject(inlinecode, original));

	describe('Code', () => testObject(code, original));
});

describe('Filtered', function() {
	describe('BoldFilter', () => testObject(boldFiltered, filtered));

	describe('Italic', () => testObject(italicFiltered, filtered));

	describe('StrikeFilter', () => testObject(strikeFiltered, filtered));

	describe('HeadingFilter', () => testObject(headingFiltered, filtered));

	describe('QuoteFilter', () => testObject(quoteFiltered, filtered));

	describe('LinkFilter', () => testObject(linkFiltered, filtered));

	describe('inlinecodeFilter', () => testObject(inlinecodeFiltered, filtered));

	describe('Code', () => testObject(code));

	describe('Nested', () => testObject(nested));

	describe('blockcodeFilter', () => testObject(blockcodeFiltered, filtered));
});

// describe.only('Marked', function() {
// 	describe('Bold', () => testObject(bold, marked));

// 	describe('Italic', () => testObject(italic, marked));

// 	describe('Strike', () => testObject(strike, marked));

// 	describe('Headers', () => {
// 		describe('Level 1', () => testObject(headersLevel1, marked));

// 		describe('Level 2', () => testObject(headersLevel2, marked));

// 		describe('Level 3', () => testObject(headersLevel3, marked));

// 		describe('Level 4', () => testObject(headersLevel4, marked));
// 	});

// 	describe('Quote', () => testObject(quote, marked));
// });
