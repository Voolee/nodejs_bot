import 'dotenv/config'
import { Telegraf, session } from 'telegraf'
import { Sequelize, Model, DataTypes } from 'sequelize'

const sequelize = new Sequelize(
	process.env.DB_NAME,
	process.env.DB_USER,
	process.env.DB_PASSWORD,
	{
		host: 'db',
		dialect: 'postgres',
		logging: false,
	}
)

class User extends Model {}

User.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		telegramid: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: true,
		},
	},
	{
		sequelize,
		modelName: 'User',
	}
)

User.sync({ alter: true })

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(session())

bot.on('text', async ctx => {
	let user
	try {
		if (!ctx.session) ctx.session = { count: 1 }

		if (!ctx.from || !ctx.from.id) {
			console.error('ctx.from or ctx.from.id is undefined!', ctx.from)
			return
		}

		const [foundOrCreatedUser, created] = await User.findOrCreate({
			where: { telegramid: ctx.from.id },
		})

		if (!foundOrCreatedUser) {
			console.error('Failed to find or create user.')
			return
		}

		user = foundOrCreatedUser
	} catch (error) {
		console.log(error)
		return
	}

	await ctx.reply(
		`Hello user with ID: ${user.id}, your count is: ${ctx.session.count}, and your Telegram ID is: ${ctx.from.id}`
	)
	ctx.session.count += 1
})

bot.catch(err => console.log(err))
bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
