<template>
	<v-dialog v-model="shown" persistent width="360" @keydown.escape="hide">
		<v-card>
			<v-card-title class="headline">
				{{ $t(tool ? (tool.filament ? 'dialog.filament.titleChange' : 'dialog.filament.titleLoad') : 'generic.noValue') }}
			</v-card-title>

			<v-card-text>
				{{ $t(filaments.length > 0 ? 'dialog.filament.prompt' : 'dialog.filament.noFilaments') }}

				<v-progress-linear indeterminate v-if="loading"></v-progress-linear>
				<v-list v-if="!loading">
					<v-list-item v-for="filament in filaments" :key="filament" @click="filamentClick(filament)">
						<v-icon class="mr-1">mdi-radiobox-marked</v-icon> {{ filament }}
					</v-list-item>
				</v-list>
			</v-card-text>

			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn color="success" text @click="hide">{{ $t('generic.cancel') }}</v-btn>
				<v-spacer></v-spacer>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
'use strict'

import { mapState, mapGetters, mapActions } from 'vuex'

import { DisconnectedError } from '../../utils/errors.js'

export default {
	props: {
		shown: {
			type: Boolean,
			required: true
		},
		tool: Object
	},
	computed: {
		...mapState('machine/model', {
			extruders: state => state.move.extruders,
			filamentsDirectory: state => state.directories.filaments
		}),
		...mapGetters('machine/model', ['currentTool'])
	},
	data() {
		return {
			filaments: [],
			loading: false
		}
	},
	methods: {
		...mapActions('machine', ['sendCode', 'getFileList']),
		async loadFilaments() {
			if (this.loading) {
				return;
			}

			this.loading = true
			try {
				const response = await this.getFileList(this.filamentsDirectory);
				this.filaments = response.filter(item => item.isDirectory).map(item => item.name);
			} catch (e) {
				if (!(e instanceof DisconnectedError)) {
					console.warn(e);
					this.$log('error', this.$t('error.filamentsLoadFailed'), e.message);
				}
				this.hide();
			}
			this.loading = false;
		},
		filamentClick(filament) {
			this.hide();

			let code = '';
			if (this.currentTool !== this.tool) {
				// Select tool first
				code = `T${this.tool.number}\n`;
			}
			if (this.tool.filamentExtruder >= 0 && this.tool.filamentExtruder < this.extruders.length &&
				this.extruders[this.tool.filamentExtruder].filament) {
				// Unload current filament
				code += 'M702\n';
			}
			// Run load sequence and configure current tool for it
			// TODO Make M703 configurable
			code += `M701 S"${filament}"\nM703`;
			this.sendCode(code);
		},
		hide() {
			this.$emit('update:shown', false);
		}
	},
	watch: {
		shown(to) {
			if (to) {
				// Load filaments when this dialog is shown
				this.loadFilaments();
			}
		}
	}
}
</script>
