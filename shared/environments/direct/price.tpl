@@IMPORT@@

@@OPEN@@@@REQUEST@@

@@INDENT@@if (!price) {
@@INDENT@@  throw new Error('No @@SYMBOL@@ price was returned.');
@@INDENT@@}

@@INDENT@@console.log('@@SYMBOL@@ REST price:', price);
@@CLOSE@@
