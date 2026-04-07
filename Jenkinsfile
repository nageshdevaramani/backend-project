pipeline {
    agent any

    environment {
        APP_NAME = "backend-app"
        IMAGE_TAG = "${BUILD_NUMBER}"
        CONTAINER_NAME = "backend"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                sh '''
                docker build -t $APP_NAME:$IMAGE_TAG .
                '''
            }
        }

        stage('Get Previous Version') {
            steps {
                script {
                    sh '''
                    PREV_TAG=$(docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Image}}" | cut -d: -f2)
                    echo $PREV_TAG > prev_tag.txt || true
                    echo "Previous running version: $PREV_TAG"
                    '''
                }
            }
        }

        stage('Deploy New Version') {
            steps {
                sh '''
                # Stop any container using port 5000
                docker ps -q --filter "publish=5000" | xargs -r docker rm -f
        
                # Stop existing backend container
                docker stop backend || true
                docker rm backend || true
        
                docker run -d \
                  --name backend \
                  -p 5000:5000 \
                  --restart unless-stopped \
                  backend-app:$IMAGE_TAG
                '''
            }
        }

        stage('Health Check') {
            steps {
                script {
                    sh 'sleep 15'  // wait for app to start

                    def status = sh(
                        script: 'curl -f http://localhost:5000/api/hello',
                        returnStatus: true
                    )

                    if (status != 0) {
                         sh 'docker logs backend || true'  // 🔥 debug logs
                        error "Health check failed"
                        
                    }
                }
            }
        }
    }

    post {
        failure {
            echo 'Deployment failed - Rolling back...'

            sh '''
            PREV_TAG=$(cat prev_tag.txt)

            if [ ! -z "$PREV_TAG" ]; then
                echo "Rolling back to version: $PREV_TAG"

                docker stop $CONTAINER_NAME || true
                docker rm $CONTAINER_NAME || true

                docker run -d \
                  --name $CONTAINER_NAME \
                  -p 5000:5000 \
                  $APP_NAME:$PREV_TAG
            else
                echo "No previous version available for rollback"
            fi
            '''
        }

        success {
            echo 'Deployment successful'
        }

        always {
            echo 'Cleaning unused images'
            sh 'docker image prune -f || true'
        }
    }
}
