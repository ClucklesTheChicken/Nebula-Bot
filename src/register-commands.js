require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
    name: 'hey',
    description: 'Replies to you, I guess',
    },
    {
    name: 'dadjoke',
    description: 'Replies with a random dad joke!',
    },
    {
    name: 'funfact',
    description: 'Replies with a fun fact!',
    },
    {
    name: 'randomquote',
    description: 'Replies with a random quote!'
    },
    {
    name: 'quote',
    description: 'Replies with a random quote from one of the Nebula members.',
    options: [
        {
            name: 'name',
            description: 'The name of the Nebula member.',
            type: ApplicationCommandOptionType.String,
            choices: [
                {
                    name: 'Cluckles',
                    value: 'cluckles',
                },
                {
                    name: 'GamerXRAY',
                    value: 'gamerxray',
                },
                {
                    name: 'Shamslop',
                    value: 'shamslop',
                }
            ], 
            required: false
        }
    ]
    },
    {
    name: 'addquote',
    description: 'Adds a quote to one of the Nebula members.',
    options: [
        {
            name: 'name',
            description: 'The name of the Nebula member.',
            type: ApplicationCommandOptionType.String,
            choices: [
                {
                    name: 'Cluckles',
                    value: 'cluckles',
                },
                {
                    name: 'GamerXRAY',
                    value: 'gamerxray',
                },
                {
                    name: 'Shamslop',
                    value: 'shamslop',
                }
            ],
            required: true
        },
        {
            name: 'quote',
            description: 'Add your quote here!',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ]
    },
    {
    name: 'pokemon',
    description: 'Get information on a Pokemon!',
    options: [
        {
            name: 'pokemon',
            description: 'The name of the Pokemon',
            type: ApplicationCommandOptionType.String, 
            required: true
        }
    ]
    },
    // {
    // name: 'embed',
    // description: 'Embeds stuff.',
    // },
    // {
    // name: 'add',
    // description: 'Adds two numbers.',
    // options: [
    //     {
    //         name: 'first-number',
    //         description: 'The first number',
    //         type: ApplicationCommandOptionType.Number, //string
    //         choices: [
    //             {
    //                 name: 'one',
    //                 value: 1,
    //             },
    //             {
    //                 name: 'two',
    //                 value: 2,
    //             },
    //             {
    //                 name: 'three',
    //                 value: 3,
    //             }
    //         ],
    //         required: true,
    //     },
    //     {
    //         name: 'second-number',
    //         description: 'The second number',
    //         type: ApplicationCommandOptionType.Number,
    //         required: true,
    //     }
    // ]
    // },
    
];

const rest = new REST({ version: '10'}).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('Slash commands registered successfully!');
    }
    catch (error) {
        console.log(`There was an error: ${error}`);
    }
})();