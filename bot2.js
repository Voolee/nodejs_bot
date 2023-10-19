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
		count: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
	},
	{
		sequelize,
		modelName: 'User',
	}
)

User.sync()

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(session())

bot.on('text', async ctx => {
	let user
	try {
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

	// Обновляем счетчик пользователя в базе данных
	user.count += 1
	await user.save()

	await ctx.reply(
		`Hello user with ID: ${user.id}, your count is: ${user.count}, and your Telegram ID is: ${ctx.from.id}`
	)
})

bot.catch(err => console.log(err))
bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
